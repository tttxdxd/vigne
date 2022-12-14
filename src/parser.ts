import { GlobalConfig } from './common/config'
import type { ApiContext } from './context'
import type { IParser, IParserClass, Token } from './types'

/**
 * 执行者 装饰器
 * @param type
 * @returns
 */
export function Parser<TFunction extends IParserClass>(type?: string): ClassDecorator {
  return ((Target: TFunction) => {
    const name = type || Target.name

    GlobalConfig.registerParser(name, new Target())
    return Target
  }) as any
}

@Parser('default')
export class DefaultParser implements IParser<Token> {
  async parse(ctx: ApiContext, token: Token): Promise<Token> {
    return token
  }
}
