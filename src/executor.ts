import { GlobalConfig } from './common/config'
import { ApiType, TokenType } from './common/enum'
import type { ApiContext } from './context'
import type { IExecutor, IExecutorClass, Token } from './types'
import { isUndefined } from './utils'

/**
 * 执行者 装饰器
 * @param type
 * @returns
 */
export function Executor<TFunction extends IExecutorClass>(type?: string): ClassDecorator {
  return ((Target: TFunction) => {
    const name = type || Target.name

    GlobalConfig.registerExecutor(name, new Target())
    return Target
  }) as any
}

@Executor('default')
export class DefaultExecutor implements IExecutor {
  constructor() {}
  async execute(ctx: ApiContext, token: Token, parsed: any) {
    return parsed
  }
}

@Executor('memory')
export class MemeryExecutor implements IExecutor {
  async execute(ctx: ApiContext, token: Token, parsed: Token) {
    const modelConfig = GlobalConfig.MODEL_MAP[token.model]
    const data: any = modelConfig.extra?.memory || []
    const { fields, filter, pagination } = parsed
    let finalData = data.map((v: any) => this.pick(v, fields?.map(v => v.field)))

    if (filter) {
      const whereKeys = Object.keys(filter)

      for (let i = 0, len = whereKeys.length; i < len; i++) {
        const key = whereKeys[i]
        const value = filter[key]

        if (Array.isArray(value))
          finalData = finalData.filter((v: any) => value.includes(v[key]))
        else
          finalData = finalData.filter((v: any) => v[key] === value)
      }
    }

    if (ApiType.Count === ctx.type)
      return finalData.length
    if (TokenType.Info === token.type)
      return finalData[0]

    if (pagination) {
      const start = pagination.offset
      const end = pagination.offset + pagination.limit
      finalData = finalData.slice(start, end)
    }

    return finalData
  }

  private pick(origin: any, props?: string[]) {
    if (isUndefined(props) || props.length === 0)
      return origin

    return props.reduce<any>((map, prop) => {
      map[prop] = origin[prop]
      return map
    }, {})
  }
}
