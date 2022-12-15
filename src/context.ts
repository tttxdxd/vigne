import { GlobalConfig } from './common/config'
import { isArray, isUndefined, set } from './utils'
import type { IInput, IOutput, Token, TokenField } from './types'
import { ApiType } from './common/enum'

export class ApiContext {
  type: ApiType
  input: IInput
  output: IOutput

  cache: Record<string, Record<string, { key: string; keys: string[]; map: Record<string, any> }>> = {}
  tokens: Token[] = []
  parsed: any[] = []
  errors: string[] = []

  constructor(type: ApiType, input: IInput) {
    this.type = type
    this.input = input
    this.output = {}
  }

  async tokenize() {
    const tokenizer = GlobalConfig.tokenizers[this.type]
    const tokens = tokenizer.tokenize(this.input)

    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i]

      if (token.errors.length)
        this.errors.push(...token.errors)
      else
        this.tokens.push(token)
    }

    return this.errors
  }

  async parse() {
    for (let i = 0, len = this.tokens.length; i < len; i++) {
      const token = this.tokens[i]
      const parser = GlobalConfig.parsers[token.info.parser]

      if (isUndefined(parser)) {
        this.errors.push('')
        this.parsed.push(null)
        continue
      }

      this.parsed.push(await parser.parse(this, token))
    }

    return this.errors
  }

  async execute() {
    const data: any = {}

    for (let i = 0, len = this.tokens.length; i < len; i++) {
      const token = this.tokens[i]
      const parsed = this.parsed[i]

      if (parsed === null) {
        i += token.extra.tokens.length
        continue
      }

      const { parentKeys, keys } = token.extra

      this.handleBeforeForeign(token)

      const executor = GlobalConfig.executors[token.info.executor]
      const value = await executor.execute(this, token, parsed)
      const cacheValue = this.handleResponse(value, token)

      this.handleAlias(token, value)
      this.handleAfterForeign(token, cacheValue, value)

      if (parentKeys.length !== 0)
        continue

      set(data, keys, value)

      if (isUndefined(value)) {
        i += token.extra.tokens.length
        continue
      }
    }

    this.output = { data }

    return this.errors
  }

  private handleResponse(value: any, token: Token) {
    const specialColumns = GlobalConfig.MODEL_COLUMNS_KEY_MAP[token.model]!
    const cache: Record<string, { key: any; keys: any[]; map: any }> = {}

    const specialFields: TokenField[]
      = token.fields?.filter((v: any) => v.temporary) || specialColumns.map(column => ({ field: column.key }))

    for (let i = 0, len = specialFields.length; i < len; i++) {
      const { field, temporary } = specialFields[i]
      const nodeCache: { key: any; keys: any[]; map: any } = {
        key: undefined,
        keys: [],
        map: {},
      }

      if (isUndefined(value)) {
        // nothing
      }
      else if (Array.isArray(value)) {
        for (let j = 0, jlen = value.length; j < jlen; j++) {
          const nodeValue = value[j]
          const key = nodeValue[field]

          nodeCache.keys.push(key)
          nodeCache.map[key] = nodeValue

          if (temporary)
            delete nodeValue[field]
        }
      }
      else {
        const nodeValue = value
        const key = nodeValue[field]

        nodeCache.key = key
        nodeCache.map[key] = nodeValue

        if (temporary)
          delete nodeValue[field]
      }

      cache[field] = nodeCache
    }

    if (specialFields.length) {
      const { parentKeys, keys } = token.extra

      this.cache[[...parentKeys, ...keys].join('.')] = cache
    }

    return cache
  }

  private handleBeforeForeign(token: Token) {
    if (isUndefined(token.foreign))
      return
    const { foreign, extra: { isBatchParent, parentKeys } } = token
    const parentPath = parentKeys.join('.')
    const parentCache = this.cache?.[parentPath]?.[foreign.referKey]
    const filterData = isBatchParent ? parentCache.keys : parentCache.key

    if (isUndefined(token.filter))
      token.filter = {}
    token.filter[foreign.key] = filterData
  }

  private handleAfterForeign(token: Token, cacheValue: any, value: any) {
    if (isUndefined(token.foreign))
      return

    const { foreign, extra: { isBatchParent, isGroup, parentKeys, keys } } = token
    const parentPath = parentKeys.join('.')
    const parentCache = this.cache?.[parentPath]?.[foreign.referKey]
    const currentCache = cacheValue[foreign.referKey]

    if (isBatchParent) {
      parentCache.keys.forEach((key: any) => {
        const tempValue = isGroup
          ? currentCache.keys.map((key: any) => currentCache.map[key])
          : currentCache.map[currentCache.key]

        set(parentCache.map[key], keys, tempValue)
      })
    }
    else {
      set(parentCache.map[parentCache.key], keys, value)
    }
  }

  private handleAlias(token: Token, value: any) {
    if (isUndefined(value))
      return

    const aliaFields: TokenField[] = token.fields?.filter((v: any) => v.alias) || []

    if (aliaFields.length) {
      for (let i = 0, len = aliaFields.length; i < len; i++) {
        const { field, alias } = aliaFields[i]

        if (isArray(value)) {
          for (let j = 0, jlen = value.length; j < jlen; j++) {
            const nodeValue = value[j]

            const temp = nodeValue[field]
            delete nodeValue[field]
            nodeValue[alias!] = temp
          }
        }
        else {
          const temp = value[field]
          delete value[field]
          value[alias!] = temp
        }
      }
    }
  }

  static query(input: IInput) {
    return new ApiContext(ApiType.Query, input)
  }

  static count(input: IInput) {
    return new ApiContext(ApiType.Count, input)
  }

  static create(input: IInput) {
    return new ApiContext(ApiType.Create, input)
  }

  static update(input: IInput) {
    return new ApiContext(ApiType.Update, input)
  }

  static delete(input: IInput) {
    return new ApiContext(ApiType.Delete, input)
  }
}
