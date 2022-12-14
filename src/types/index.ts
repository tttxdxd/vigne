import type { ApiContext } from '../context'
import type { ApiCode } from '../common/enum'
import type { Token } from './token'

export * from './token'
export * from './model'

export type IInput = Record<string, any>

export interface IOutput {
  data?: any
  code?: ApiCode
  msg?: string
  errors?: string[]
}

export interface IExecutor {
  execute(ctx: ApiContext, token: Token, parsed: any): Promise<any>
}

export interface IExecutorClass {
  new (): IExecutor
}

export interface IParser<T = any> {
  parse(ctx: ApiContext, token: Token): Promise<T>
}

export interface IParserClass {
  new (): IParser
}
