import type { ApiContext } from './context'
import type { Token } from './tokenizer'
import { ApiManager } from '.'

export interface IParser<T = any> {
  parse(ctx: ApiContext, token: Token): Promise<T>
}

interface IParserClass {
  new (): IParser
}

/**
 * 执行者 装饰器
 * @param type
 * @returns
 */
export function Parser<TFunction extends IParserClass>(type?: string): ClassDecorator {
  return ((Target: TFunction) => {
    const name = type || Target.name

    ApiManager.registerParser(name, new Target())
    return Target
  }) as any
}

@Parser('default')
export class DefaultParser implements IParser<Token> {
  async parse(ctx: ApiContext, token: Token): Promise<Token> {
    return token
  }
}
