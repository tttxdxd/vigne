import type { Token } from '.'

export interface IModelColumn {
  key: string
  desc: string
  type: string
  isPrimary?: boolean
  isForeign?: boolean
}

export interface IModelForeign {
  key: string
  reference: string
  referKey: string
}

export interface IModelConfig {
  name: string
  groupName: string
  desc: string
  primary: string
  parser: string
  executor: string

  columns: IModelColumn[]
  foreigns?: IModelForeign[]

  extra?: {
    [key: string]: any
  }
}

export interface ISimpleModelConfig {
  model: string
  groupModel: string
  parser: string
  executor: string

  /**
   * 是否是模型数组
   */
  isGroup: boolean
}

export interface ISimpleModelExtra {
  /**
   * 是否是模型数组
   */
  isGroup: boolean

  /**
   * 是否存在父节点
   */
  isUnion: boolean

  /**
   * 是否批量获取
   */
  isBatch: boolean

  /**
   * 父节点 是否是披露获取
   */
  isBatchParent: boolean

  /**
   * 当前路径
   */
  keys: string[]

  /**
   * 父节点路径
   */
  parentKeys: string[]

  /**
   * 子节点
   */
  tokens: Token[]
}
