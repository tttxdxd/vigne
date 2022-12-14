import { isObject } from './utils'
import { ApiContext } from './context'
import type { IExecutor, IInput, IModelConfig, IOutput, IParser } from './types'
import { GlobalConfig } from './common/config'
import { ApiCode } from './common/enum'
import { API_OUTPUT } from './common/constants'

export class Vigne {
  static isDebug = true

  static registerModel(modelConfig: IModelConfig) {
    GlobalConfig.registerModel(modelConfig)
  }

  static registerParser(type: string, parser: IParser) {
    GlobalConfig.registerParser(type, parser)
  }

  static registerExecutor(type: string, executor: IExecutor) {
    GlobalConfig.registerExecutor(type, executor)
  }

  static async query(input: IInput): Promise<IOutput> {
    if (!isObject(input))
      return this.error(ApiCode.InputError)

    const ctx = ApiContext.query(input)

    await ctx.tokenize()
    await ctx.parse()
    await ctx.execute()

    return ctx.output
  }

  static async create(input: IInput): Promise<IOutput> {
    if (!isObject(input))
      return this.error(ApiCode.InputError)

    const ctx = ApiContext.create(input)

    await ctx.tokenize()
    await ctx.parse()
    await ctx.execute()

    return ctx.output
  }

  private static error(apiCode: ApiCode) {
    return API_OUTPUT[apiCode]
  }
}
