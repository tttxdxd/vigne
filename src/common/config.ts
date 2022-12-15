import type { IRule } from '../rules'
import { Rules } from '../rules'
import { Tokenizer } from '../tokenizer'
import type { IExecutor, IModelColumn, IModelConfig, IParser, ISimpleModelConfig, Token } from '../types'
import { isUndefined } from '../utils'
import { ApiType } from './enum'

export class GlobalConfig {
  static MODEL_MAP: Record<string, IModelConfig> = {}
  static MODEL_INFO_MAP: Record<string, ISimpleModelConfig> = {}
  static MODEL_RULES_MAP: Record<string, Record<string, IRule>> = {}
  static MODEL_COLUMNS_MAP: Record<string, Record<string, true>> = {}
  static MODEL_COLUMNS_KEY_MAP: Record<string, IModelColumn[]> = {}

  static tokenizers = {
    [ApiType.Query]: new Tokenizer(),
    [ApiType.Create]: new Tokenizer(),
    [ApiType.Update]: new Tokenizer(),
    [ApiType.Delete]: new Tokenizer(),
    [ApiType.Count]: new Tokenizer(),
  }

  static parsers: Record<string, IParser> = {}
  static executors: Record<string, IExecutor> = {}

  static registerModel(modelConfig: IModelConfig) {
    const model = modelConfig.name
    const groupModel = modelConfig.groupName
    const parser = modelConfig.parser
    const executor = modelConfig.executor

    this.MODEL_MAP[model] = modelConfig
    this.MODEL_MAP[groupModel] = modelConfig
    this.MODEL_INFO_MAP[model] = { model, groupModel, parser, executor, isGroup: false }
    this.MODEL_INFO_MAP[groupModel] = { model, groupModel, parser, executor, isGroup: true }

    this.MODEL_RULES_MAP[model] = {
      ...Rules.KEY_LOADER_MAP,
      ...modelConfig.columns.reduce<Record<string, IRule>>((map, column) => {
        map[column.key] = (token: Token, key: string, value: any) => {
          if (token.extra.isGroup) {
            if (Array.isArray(value)) {
              if (value.some(v => typeof v !== column.type))
                return 'key type error'
            }
            else if (typeof value !== column.type) { return 'key type error' }
          }
          else if (typeof value !== column.type) { return 'key type error' }

          if (isUndefined(token.filter))
            token.filter = {}
          token.filter[column.key] = value
        }

        return map
      }, {}),
    }
    this.MODEL_COLUMNS_MAP[model] = modelConfig.columns.reduce<Record<string, true>>((map, column) => {
      map[column.key] = true

      return map
    }, {})
    this.MODEL_COLUMNS_KEY_MAP[model] = modelConfig.columns.reduce<IModelColumn[]>((list, column) => {
      if (column.isPrimary || column.isForeign)
        list.push(column)

      return list
    }, [])
  }

  static registerParser(type: string, parser: IParser) {
    this.parsers[type] = parser
  }

  static registerExecutor(type: string, executor: IExecutor) {
    this.executors[type] = executor
  }
}

export interface Config {
  keys: {
    model: string
    field: string
    sort: string
    pagination: string
  }

  pagination: {
    key: string
    offset: number
    limit: number
  }
}

export const DEFAULT_CONFIG: Config = {
  keys: {
    model: '@model',
    field: '@field',
    sort: '@sort',
    pagination: '@pagination',
  },
  pagination: {
    key: 'pagination',
    offset: 0,
    limit: 10,
  },
}

export function defineConfig() {}
