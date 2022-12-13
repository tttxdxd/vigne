import { isObject, isUndefined } from './utils'
import type { IModelColumn, IModelConfig, ISimpleModelConfig } from './model'
import type { IOutput } from './context'
import { API_OUTPUT, ApiCode, ApiContext, ApiType } from './context'
import type { Token } from './tokenizer'
import { Tokenizer } from './tokenizer'
import type { IRule } from './rules'
import { Rules } from './rules'
import type { IParser } from './parser'
import type { IExecutor } from './executor'

export class ApiManager {
  static isDebug = true

  static MODEL_MAP: Record<string, IModelConfig> = {}
  static MODEL_INFO_MAP: Record<string, ISimpleModelConfig> = {}
  static MODEL_RULES_MAP: Record<string, Record<string, IRule>> = {}
  static MODEL_COLUMNS_MAP: Record<string, Record<string, true>> = {}
  static MODEL_COLUMNS_KEY_MAP: Record<string, IModelColumn[]> = {}

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
        map[column.key] = (ctx: ApiContext, token: Token, key: string, value: any) => {
          if (typeof value !== column.type)
            return 'key type error'
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

  static tokenizers = {
    [ApiType.Query]: new Tokenizer(),
    [ApiType.Create]: new Tokenizer(),
    [ApiType.Update]: new Tokenizer(),
    [ApiType.Delete]: new Tokenizer(),
    [ApiType.Count]: new Tokenizer(),
  }

  static parsers: Record<string, IParser> = {}
  static executors: Record<string, IExecutor> = {}

  static registerParser(type: string, parser: IParser) {
    this.parsers[type] = parser
  }

  static registerExecutor(type: string, executor: IExecutor) {
    this.executors[type] = executor
  }

  static async query(input: any): Promise<IOutput> {
    if (!isObject(input))
      return API_OUTPUT[ApiCode.InputError]

    const ctx = ApiContext.query(input)

    await ctx.tokenize()
    await ctx.parse()
    await ctx.execute()

    return ctx.output
  }

  static async create(input: any): Promise<IOutput> {
    if (!isObject(input))
      return API_OUTPUT[ApiCode.InputError]

    const ctx = ApiContext.create(input)

    await ctx.tokenize()
    await ctx.parse()
    await ctx.execute()

    return ctx.output
  }
}
