import { hasOwnProperty, isFunction, isNotUndefined, isNull, isUndefined } from './utils'
import type { ApiContext } from './context'
import type { ISimpleModelConfig, ISimpleModelExtra } from './model'
import { Rules } from './rules'
import { ApiManager } from '.'

// #region Token type definitions

export enum TokenType {
  Info,
  List,
}

export interface TokenField {
  field: string
  alias?: string
  temporary?: boolean
}

export interface TokenSort {
  field: string
  /**
   * asc 升序 desc 降序
   */
  order: 'asc' | 'desc'
}
export interface TokenForeign {
  key: string
  reference: string
  referKey: string
  reverse?: boolean
}

export interface TokenPagination {
  enabled: boolean
  offset: number
  limit: number
}

export type TokenFilter = any

/**
 * 通用请求 token
 */
export interface Token {
  /**
   * 唯一 ID
   */
  id: string

  /**
   * token 类型
   */
  type: TokenType

  /**
   * 模型名称
   */
  model: string

  /**
   * 模型简单配置信息
   */
  modelInfo: ISimpleModelConfig

  /**
   * 模型额外信息
   */
  modelExtra: ISimpleModelExtra

  /**
   * 字段
   */
  fields?: TokenField[]

  /**
   * 排序
   */
  sorts?: TokenSort[]

  /**
   * 分页
   */
  pagination?: TokenPagination

  /**
   * 条件查询
   */
  filter?: TokenFilter

  /**
   * 外键
   */
  foreign?: TokenForeign
}

// #endregion

/**
 * 入参解析
 */
export class Tokenizer {
  tokenize(ctx: ApiContext): ApiContext {
    const tokens: Token[] = []
    const input = ctx.input
    const inputKeys = Object.keys(input)

    for (let i = 0, len = inputKeys.length; i < len; i++) {
      const inputKey = inputKeys[i]
      const inputValue = this.getModelValue(ctx, inputKey, input[inputKey])
      const inputTokens = this.getTokens(ctx, inputKey, inputValue)

      tokens.push(...inputTokens)
    }

    ctx.tokens = tokens

    return ctx
  }

  private getTokens(
    ctx: ApiContext,
    mainKey: string,
    mainValue?: Record<string, any>,
    parentTokens: Token[] = [],
    foriegn?: TokenForeign,
  ): Token[] {
    const tokens: Token[] = []

    if (isUndefined(mainValue)) {
      ctx.errors.push('')
      return tokens
    }

    const modelInfo = this.getModelInfo(mainKey, mainValue)

    if (modelInfo === null) {
      ctx.errors.push('')
      return tokens
    }

    const parentToken = parentTokens.length ? parentTokens[parentTokens.length - 1] : undefined
    const modelExtra = this.getModelExtra(mainKey, modelInfo, parentToken)
    const modelRules = ApiManager.MODEL_RULES_MAP[modelInfo.model]!
    const tokenType = this.getTokenType(modelExtra)
    const token = this.token(tokenType, modelInfo, modelExtra, foriegn)

    const afterTokens = []
    const keys = Object.keys(mainValue)

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      const value = mainValue[key]

      if (value == null) {
        ctx.errors.push('')
        return tokens
      }

      const rule = modelRules[key]

      if (isFunction(rule)) {
        const error = rule.call(this, ctx, token, key, value)

        if (isUndefined(error))
          continue

        ctx.errors.push(error)
        return tokens
      }

      // parse foriegn
      const foriegnTokens = this.getForeignTokens(ctx, key, value, [...parentTokens, token])

      if (foriegnTokens !== null) {
        afterTokens.push(...foriegnTokens)
        continue
      }

      ctx.errors.push('')
      return tokens
    }

    // TODO 未查询嵌套节点， 无需查询额外的父节点参数

    tokens.push(token, ...afterTokens)

    return tokens
  }

  private getModelValue(ctx: ApiContext, key: string, value: any): Record<string, any> | undefined {
    const modelValue = Rules.MODEL_RULE(value)

    if (modelValue === true)
      return {}
    return value
  }

  private getModelInfo(key: string, value: Record<string, any>): ISimpleModelConfig | null {
    if (hasOwnProperty(value, Rules.KEY_MODEL)) {
      const model = value[Rules.KEY_MODEL]
      const modelInfo = ApiManager.MODEL_INFO_MAP[model]

      if (modelInfo)
        return modelInfo
    }

    const modelInfo = ApiManager.MODEL_INFO_MAP[key]

    if (modelInfo)
      return modelInfo

    return null
  }

  private getModelExtra(mainKey: string, modelInfo: ISimpleModelConfig, parentToken?: Token): ISimpleModelExtra {
    const isGroup = modelInfo.isGroup
    const isUnion = !!parentToken
    const isBatchParent = isUnion ? parentToken.modelExtra.isBatch : false
    const modelExtra: ISimpleModelExtra = {
      isGroup,
      isUnion,
      isBatch: isGroup || isBatchParent,
      isBatchParent,
      keys: [mainKey],
      parentKeys: isUnion ? [...parentToken.modelExtra.parentKeys, ...parentToken.modelExtra.keys] : [],
    }

    return modelExtra
  }

  private getTokenType(modelExtra: ISimpleModelExtra): TokenType {
    if (modelExtra.isGroup)
      return TokenType.List

    return TokenType.Info
  }

  private getForeignTokens(ctx: ApiContext, key: string, value: any, parentTokens: Token[]): Token[] | null {
    const modelInfo = this.getModelInfo(key, value)

    if (isNull(modelInfo))
      return null

    const parentToken = parentTokens[parentTokens.length - 1]
    const modelConfig = ApiManager.MODEL_MAP[modelInfo.model]!
    const foreign = modelConfig.foreigns?.find(v => v.reference === parentToken.model)

    if (isUndefined(foreign)) {
      const parentModelInfo = ApiManager.MODEL_MAP[parentToken.model]!
      const reverseForeign = parentModelInfo.foreigns?.find(v => v.reference === modelInfo.model)

      if (isNotUndefined(reverseForeign)) {
        return this.getTokens(ctx, key, value, parentTokens, {
          key: reverseForeign.referKey,
          reference: parentModelInfo.name,
          referKey: reverseForeign.key,
          reverse: true,
        })
      }

      return null
    }

    return this.getTokens(ctx, key, value, parentTokens, foreign)
  }

  private token(
    type: TokenType,
    modelInfo: ISimpleModelConfig,
    modelExtra: ISimpleModelExtra,
    foreign?: TokenForeign,
  ): Token {
    return {
      id: '',
      type,
      model: modelInfo.model,
      modelInfo,
      modelExtra,
      foreign,
      filter: foreign ? {} : undefined,
    }
  }
}
