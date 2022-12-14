// #region Token type definitions

import type { TokenType } from '../common/enum'
import type { ISimpleModelConfig, ISimpleModelExtra } from '.'

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
  info: ISimpleModelConfig

  /**
   * 模型额外信息
   */
  extra: ISimpleModelExtra

  /**
   * 错误信息
   */
  errors: string[]

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
