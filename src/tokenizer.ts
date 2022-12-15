import { hasOwnProperty, isFunction, isNotUndefined, isNull, isUndefined } from './utils'
import { Rules } from './rules'
import type { IInput, ISimpleModelConfig, ISimpleModelExtra, Token, TokenForeign } from './types'
import { GlobalConfig } from './common/config'

/**
 * 入参解析
 */
export class Tokenizer {
  tokenize(input: IInput): Token[] {
    const tokens: Token[] = []
    const inputKeys = Object.keys(input)

    for (let i = 0, len = inputKeys.length; i < len; i++) {
      const inputKey = inputKeys[i]
      const inputValue = this.getModelValue(inputKey, input[inputKey])
      const inputTokens = this.getTokens(inputKey, inputValue)

      tokens.push(...inputTokens)
    }

    return tokens
  }

  private getTokens(
    mainKey: string,
    mainValue?: Record<string, any>,
    parentTokens: Token[] = [],
    foriegn?: TokenForeign,
  ): Token[] {
    const tokens: Token[] = []

    if (isUndefined(mainValue))
      return [{ id: '', key: mainKey, errors: [''] } as any]

    const modelInfo = this.getModelInfo(mainKey, mainValue)

    if (modelInfo === null)
      return [{ id: '', key: mainKey, errors: [''] } as any]

    const parentToken = parentTokens.length ? parentTokens[parentTokens.length - 1] : undefined
    const modelExtra = this.getModelExtra(mainKey, modelInfo, parentToken)
    const modelRules = GlobalConfig.MODEL_RULES_MAP[modelInfo.model]!
    const token = this.token(mainKey, modelInfo, modelExtra, foriegn)

    tokens.push(token)

    const afterTokens = []
    const keys = Object.keys(mainValue)

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      const value = mainValue[key]

      if (value == null) {
        token.errors.push('')
        return tokens
      }

      const rule = modelRules[key]

      if (isFunction(rule)) {
        const error = rule.call(this, token, key, value)

        if (isUndefined(error))
          continue

        token.errors.push('')
        return tokens
      }

      if (token.errors.length)
        return tokens

      // parse foriegn
      const foriegnTokens = this.getForeignTokens(key, value, [...parentTokens, token])

      if (foriegnTokens !== null) {
        afterTokens.push(...foriegnTokens)
        continue
      }

      token.errors.push('')
      return tokens
    }

    // TODO 未查询嵌套节点， 无需查询额外的父节点参数

    token.extra.tokens = afterTokens
    tokens.push(...afterTokens)

    return tokens
  }

  private getModelValue(key: string, value: any): Record<string, any> | undefined {
    const modelValue = Rules.MODEL_RULE(value)

    if (modelValue === true)
      return {}
    return value
  }

  private getModelInfo(key: string, value: Record<string, any>): ISimpleModelConfig | null {
    if (hasOwnProperty(value, Rules.KEY_MODEL)) {
      const model = value[Rules.KEY_MODEL]
      const modelInfo = GlobalConfig.MODEL_INFO_MAP[model]

      if (modelInfo)
        return modelInfo
    }

    const modelInfo = GlobalConfig.MODEL_INFO_MAP[key]

    if (modelInfo)
      return modelInfo

    return null
  }

  private getModelExtra(mainKey: string, modelInfo: ISimpleModelConfig, parentToken?: Token): ISimpleModelExtra {
    const isGroup = modelInfo.isGroup
    const isUnion = !!parentToken
    const isBatchParent = isUnion ? parentToken.extra.isBatch : false
    const modelExtra: ISimpleModelExtra = {
      isGroup,
      isUnion,
      isBatch: isGroup || isBatchParent,
      isBatchParent,
      keys: [mainKey],
      parentKeys: isUnion ? [...parentToken.extra.parentKeys, ...parentToken.extra.keys] : [],
      tokens: [],
    }

    return modelExtra
  }

  private getForeignTokens(key: string, value: any, parentTokens: Token[]): Token[] | null {
    const modelInfo = this.getModelInfo(key, value)

    if (isNull(modelInfo))
      return null

    const parentToken = parentTokens[parentTokens.length - 1]
    const modelConfig = GlobalConfig.MODEL_MAP[modelInfo.model]!
    const foreign = modelConfig.foreigns?.find(v => v.reference === parentToken.model)

    if (isUndefined(foreign)) {
      const parentModelInfo = GlobalConfig.MODEL_MAP[parentToken.model]!
      const reverseForeign = parentModelInfo.foreigns?.find(v => v.reference === modelInfo.model)

      if (isNotUndefined(reverseForeign)) {
        return this.getTokens(key, value, parentTokens, {
          key: reverseForeign.referKey,
          reference: parentModelInfo.name,
          referKey: reverseForeign.key,
          reverse: true,
        })
      }

      return null
    }

    return this.getTokens(key, value, parentTokens, foreign)
  }

  private token(
    key: string,
    info: ISimpleModelConfig,
    extra: ISimpleModelExtra,
    foreign?: TokenForeign,
  ): Token {
    return {
      id: '',
      key,
      errors: [],
      model: info.model,
      info,
      extra,
      foreign: foreign || undefined,
    }
  }
}
