import { hasOwnProperty, isObject, isString } from './utils'
import type { ApiContext } from './context'
import type { Token, TokenField } from './tokenizer'
import { ApiManager } from '.'

export type IRule = (ctx: ApiContext, token: Token, key: string, value: any) => string | undefined

export class Rules {
  static KEY_MODEL = '@model'
  static KEY_FIELD = '@field'
  static KEY_SORT = '@sort'
  static KEY_PAGINATION = '@pagination'

  static DEFAULT_PAGINATION_OFFSET = 0
  static DEFAULT_PAGINATION_LIMIT = 10

  static DEFAULT_PAGINATION_KEY = 'pagination'

  static MODEL_RULE = (value: unknown) => (value === true || isObject(value) ? value : undefined)
  static KEY_LOADER_MAP: Record<string, IRule> = {
    [this.KEY_MODEL]: () => undefined,
    [this.KEY_FIELD]: (ctx: ApiContext, token: Token, key: string, value: any) => {
      if (!isString(value))
        return 'key is not a string'
      if (value.length === 0)
        return undefined

      const fields: TokenField[] = []
      const columns = ApiManager.MODEL_COLUMNS_MAP[token.model]!
      const nameSet: Record<string, TokenField> = {}
      const len = value.length
      const lastIndex = len - 1
      let index = 0
      let field = ''
      let alias = ''
      let isAlias = false

      do {
        const char = value[index]

        if (char === ',' || index === lastIndex) {
          if (alias) {
            if (nameSet[alias])
              return 'key repeating alias'
            if (columns[alias])
              return 'key repeating alias'
            if (!field)
              return 'no field'
            const fieldItem = { field, alias }

            nameSet[field] = fieldItem
            nameSet[alias] = fieldItem
            fields.push(fieldItem)
          }
          else if (field) {
            if (nameSet[alias])
              return 'key repeating field'
            const fieldItem = { field }

            nameSet[field] = fieldItem
            fields.push(fieldItem)
          }
          isAlias = false
          field = ''
          alias = ''
        }
        else if (char === ':') {
          isAlias = true
        }
        else if (isAlias) {
          alias += char
        }
        field += char
      } while (++index < len)

      const specialColumns = ApiManager.MODEL_COLUMNS_KEY_MAP[token.model]!

      for (let i = 0, len = specialColumns.length; i < len; i++) {
        const column = specialColumns[i]

        if (nameSet[column.key])
          continue

        fields.push({ field: column.key, temporary: true })
      }

      token.fields = fields
    },
    [this.KEY_SORT]: (ctx: ApiContext, token: Token, key: string, value: any) => {
      if (!isString(value))
        return 'key is not a string'
      const columns = ApiManager.MODEL_COLUMNS_MAP[token.model]!

      token.sorts = value
        .split(',')
        .map(v => v.trim())
        .filter(v => !!v)
        .map((v) => {
          const order = v.startsWith('-') ? ('desc' as const) : ('asc' as const)
          const field = order === 'desc' ? v.slice(1) : v

          return { field, order }
        })
        .filter(({ field }) => columns[field])
    },
    [this.KEY_PAGINATION]: (ctx: ApiContext, token: Token, key: string, value: any) => {
      if (value === true) {
        token.modelExtra.keys.push(Rules.DEFAULT_PAGINATION_KEY)
        token.pagination = {
          enabled: true,
          offset: Rules.DEFAULT_PAGINATION_LIMIT,
          limit: Rules.DEFAULT_PAGINATION_LIMIT,
        }
        return
      }
      else if (isObject(value)) {
        const enabled = hasOwnProperty(value, 'enabled') ? value.enabled : false

        if (enabled)
          token.modelExtra.keys.push(Rules.DEFAULT_PAGINATION_KEY)
        token.pagination = {
          enabled,
          offset: hasOwnProperty(value, 'offset') ? value.offset : Rules.DEFAULT_PAGINATION_LIMIT,
          limit: hasOwnProperty(value, 'limit') ? value.limit : Rules.DEFAULT_PAGINATION_LIMIT,
        }
        return
      }

      return 'value is not a pagination'
    },
  }
}
