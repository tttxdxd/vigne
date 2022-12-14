import { GlobalConfig } from './common/config'
import { isArray, isNotUndefined, isUndefined } from './utils'
import type { IInput, IOutput, Token, TokenField } from './types'
import { ApiType } from './common/enum'

export class ApiContext {
  type: ApiType
  input: IInput
  output: IOutput

  cache: any = {}
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

    this.tokens = tokenizer.tokenize(this)

    return this.errors
  }

  async parse() {
    for (let i = 0, len = this.tokens.length; i < len; i++) {
      const token = this.tokens[i]

      if (token.errors.length) {
        this.errors.push('')
        this.parsed.push(null)
        continue
      }

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
    const cache: any = {}
    const data: any = {}

    for (let i = 0, len = this.tokens.length; i < len; i++) {
      const token = this.tokens[i]
      const parsed = this.parsed[i]
      const { foreign } = token
      const { parentKeys, keys, isBatchParent, isGroup } = token.extra
      const parentPath = parentKeys.join('.')

      if (parsed === null) {
        if (isNotUndefined(foreign)) {
          const parentCache = cache?.[parentPath]?.[foreign.referKey]

          if (isBatchParent) {
            parentCache.keys.forEach((key: any) => {
              this.set(parentCache.map[key], keys, undefined)
            })
          }
          else {
            this.set(parentCache.map[parentCache.key], keys, undefined)
          }
        }

        if (parentKeys.length !== 0)
          continue

        this.set(data, keys, undefined)

        i += token.extra.childTokens.length
        continue
      }

      if (isNotUndefined(foreign)) {
        const parentCache = cache?.[parentPath]?.[foreign.referKey]
        const filterData = isBatchParent ? parentCache.keys : parentCache.key

        token.filter[foreign.key] = filterData
      }

      const executor = GlobalConfig.executors[token.info.executor]
      const value = await executor.execute(this, token, parsed)
      const cacheValue = this.handleResponse(value, token, cache, parentKeys, keys)

      this.handleAlias(value, token)

      if (isNotUndefined(foreign)) {
        const parentCache = cache?.[parentPath]?.[foreign.referKey]
        const currentCache = cacheValue[foreign.referKey]

        if (isBatchParent) {
          parentCache.keys.forEach((key: any) => {
            const tempValue = isGroup
              ? currentCache.keys.map(key => currentCache.map[key])
              : currentCache.map[currentCache.key]

            this.set(parentCache.map[key], keys, tempValue)
          })
        }
        else {
          this.set(parentCache.map[parentCache.key], keys, value)
        }
      }

      if (parentKeys.length !== 0)
        continue

      this.set(data, keys, value)

      if (isUndefined(value)) {
        i += token.extra.childTokens.length
        continue
      }
    }

    this.output = { data }

    return this.errors
  }

  private set(origin: any, path: string[], value: any) {
    if (typeof origin !== 'object')
      return origin

    const len = path.length
    const lastIndex = len - 1
    let nested = origin
    for (let i = 0; i < lastIndex; i++) {
      const key = path[i]
      const value = nested[key]

      if (isUndefined(value))
        nested[key] = {}

      nested = nested[key]
    }

    nested[path[lastIndex]] = value

    return origin
  }

  private handleResponse(value: any, token: Token, parentCache: any, parentKeys: string[], keys: string[]) {
    const specialColumns = GlobalConfig.MODEL_COLUMNS_KEY_MAP[token.model]!
    const cache: Record<string, { key: any; keys: any[]; map: any }> = {}

    const specialFields: TokenField[]
      = token.fields?.filter(v => v.temporary) || specialColumns.map(column => ({ field: column.key }))

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

    if (specialFields.length)
      parentCache[[...parentKeys, ...keys].join('.')] = cache

    return cache
  }

  private handleAlias(value: any, token: Token) {
    if (isUndefined(value))
      return

    const aliaFields: TokenField[] = token.fields?.filter(v => v.alias) || []

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
