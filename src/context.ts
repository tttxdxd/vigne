import { isNotUndefined, isUndefined } from './utils'
import type { Token, TokenField } from './tokenizer'
import { ApiManager } from '.'

export enum ApiType {
  Query,
  Create,
  Update,
  Delete,
  Count,
}

export enum ApiCode {
  InputError = 1,
}

export const API_OUTPUT: Record<ApiCode, IOutput> = {
  [ApiCode.InputError]: { code: ApiCode.InputError, msg: 'input error' },
}

export interface IOutput {
  data?: any
  code?: ApiCode
  msg?: string
  errors?: string[]
}

export class ApiContext {
  type: ApiType
  input: any
  output: IOutput

  cache: any = {}
  tokens: Token[] = []
  parsed: any[] = []
  errors: string[] = []

  constructor(type: ApiType, input: any) {
    this.type = type
    this.input = input
    this.output = {}
  }

  async tokenize() {
    ApiManager.tokenizers[this.type].tokenize(this)
  }

  async parse() {
    for (let i = 0, len = this.tokens.length; i < len; i++) {
      const token = this.tokens[i]
      const parser = ApiManager.parsers[token.modelInfo.parser]

      if (isUndefined(parser)) {
        this.errors.push('')
        this.parsed.push(null)
        continue
      }

      this.parsed.push(await parser.parse(this, token))
    }
  }

  async execute() {
    const cache: any = {}
    const data: any = {}

    for (let i = 0, len = this.tokens.length; i < len; i++) {
      const token = this.tokens[i]
      const parsed = this.parsed[i]

      if (parsed === null)
        continue

      const { foreign } = token
      const { parentKeys, keys, isBatchParent, isGroup } = token.modelExtra
      const parentPath = parentKeys.join('.')

      if (isNotUndefined(foreign)) {
        const parentCache = cache?.[parentPath]?.[foreign.referKey]
        const filterData = isBatchParent ? parentCache.keys : parentCache.key

        token.filter[foreign.key] = filterData
      }

      const executor = ApiManager.executors[token.modelInfo.executor]
      const value = await executor.execute(this, token, parsed)
      const cacheValue = this.setCache(value, token, cache, parentKeys, keys)

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
    }

    this.output = { data }
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

  private setCache(value: any, token: Token, parentCache: any, parentKeys: string[], keys: string[]) {
    const specialColumns = ApiManager.MODEL_COLUMNS_KEY_MAP[token.model]!
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

      if (Array.isArray(value)) {
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

  static query(input: any) {
    return new ApiContext(ApiType.Query, input)
  }

  static count(input: any) {
    return new ApiContext(ApiType.Count, input)
  }

  static create(input: any) {
    return new ApiContext(ApiType.Create, input)
  }

  static update(input: any) {
    return new ApiContext(ApiType.Update, input)
  }

  static delete(input: any) {
    return new ApiContext(ApiType.Delete, input)
  }
}
