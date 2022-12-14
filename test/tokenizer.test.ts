import { describe, expect, it } from 'vitest'
import { ApiContext } from 'vigne'

import { TokenType } from '../src/common/enum'

import './mock'

const tokens = (input: Record<string, any>) => {
  const ctx = ApiContext.query(input)

  ctx.tokenize()

  return ctx.tokens
}

describe('tokenizer', () => {
  it('tokenize empty', () => {
    const input = {}
    const output = tokens(input)

    expect(output.length).toBe(0)
    expect(output).toMatchObject([])
  })

  it('tokenize model true', () => {
    const input = { test: true }
    const output = tokens(input)

    expect(output.length).toBe(1)
    expect(output[0]).toMatchObject({
      type: TokenType.Info,
      model: 'test',
      info: { model: 'test', groupModel: 'tests', isGroup: false },
      extra: { isGroup: false, isUnion: false, isBatch: false, isBatchParent: false },
    })
  })

  it('tokenize model {}', () => {
    const input = { test: {} }
    const output = tokens(input)

    expect(output.length).toBe(1)
    expect(output[0]).toMatchObject({
      type: TokenType.Info,
      model: 'test',
      info: { model: 'test', groupModel: 'tests', isGroup: false },
      extra: {
        isGroup: false,
        isUnion: false,
        isBatch: false,
        isBatchParent: false,
        keys: ['test'],
        parentKeys: [],
      },
    })
  })

  it('tokenize model: @model', () => {
    const input = { alias: { '@model': 'test' } }
    const output = tokens(input)

    expect(output.length).toBe(1)
    expect(output[0]).toMatchObject({
      type: TokenType.Info,
      model: 'test',
      info: { model: 'test', groupModel: 'tests', isGroup: false },
      extra: {
        isGroup: false,
        isUnion: false,
        isBatch: false,
        isBatchParent: false,
        keys: ['alias'],
        parentKeys: [],
      },
    })
  })

  it('tokenize model with sub model', () => {
    const input = { test: { model: {} } }
    const output = tokens(input)

    expect(output).toMatchObject([
      {
        type: TokenType.Info,
        model: 'test',
        info: { model: 'test', groupModel: 'tests', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: false,
          isBatch: false,
          isBatchParent: false,
          keys: ['test'],
          parentKeys: [],
        },
      },
      {
        type: TokenType.Info,
        model: 'model',
        info: { model: 'model', groupModel: 'models', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: true,
          isBatch: false,
          isBatchParent: false,
          keys: ['model'],
          parentKeys: ['test'],
        },
        foreign: {
          key: 'testId',
          reference: 'test',
          referKey: 'id',
        },
      },
    ])
  })

  it('tokenize models', () => {
    const input = { tests: { model: {} } }
    const output = tokens(input)

    expect(output).toMatchObject([
      {
        type: TokenType.List,
        model: 'test',
        info: { model: 'test', groupModel: 'tests', isGroup: true },
        extra: {
          isGroup: true,
          isUnion: false,
          isBatch: true,
          isBatchParent: false,
          keys: ['tests'],
          parentKeys: [],
        },
      },
      {
        type: TokenType.Info,
        model: 'model',
        info: { model: 'model', groupModel: 'models', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: true,
          isBatch: true,
          isBatchParent: true,
          keys: ['model'],
          parentKeys: ['tests'],
        },
        foreign: {
          key: 'testId',
          reference: 'test',
          referKey: 'id',
        },
      },
    ])
  })

  it('tokenize models with sub models', () => {
    const input = { tests: { models: {} } }
    const output = tokens(input)

    expect(output).toMatchObject([
      {
        type: TokenType.List,
        model: 'test',
        info: { model: 'test', groupModel: 'tests', isGroup: true },
        extra: {
          isGroup: true,
          isUnion: false,
          isBatch: true,
          isBatchParent: false,
          keys: ['tests'],
          parentKeys: [],
        },
      },
      {
        type: TokenType.List,
        model: 'model',
        info: { model: 'model', groupModel: 'models', isGroup: true },
        extra: {
          isGroup: true,
          isUnion: true,
          isBatch: true,
          isBatchParent: true,
          keys: ['models'],
          parentKeys: ['tests'],
        },
        foreign: {
          key: 'testId',
          reference: 'test',
          referKey: 'id',
        },
      },
    ])
  })

  it('tokenize mutiple model', () => {
    const input = { test: {}, model: {}, connect: {} }
    const output = tokens(input)

    expect(output).toMatchObject([
      {
        type: TokenType.Info,
        model: 'test',
        info: { model: 'test', groupModel: 'tests', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: false,
          isBatch: false,
          isBatchParent: false,
          keys: ['test'],
          parentKeys: [],
        },
      },
      {
        type: TokenType.Info,
        model: 'model',
        info: { model: 'model', groupModel: 'models', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: false,
          isBatch: false,
          isBatchParent: false,
          keys: ['model'],
          parentKeys: [],
        },
      },
      {
        type: TokenType.Info,
        model: 'connect',
        info: { model: 'connect', groupModel: 'connects', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: false,
          isBatch: false,
          isBatchParent: false,
          keys: ['connect'],
          parentKeys: [],
        },
      },
    ])
  })

  it('tokenize model with two model', () => {
    const input = { connect: { test: {}, model: {} } }
    const output = tokens(input)

    expect(output).toMatchObject([
      {
        type: TokenType.Info,
        model: 'connect',
        info: { model: 'connect', groupModel: 'connects', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: false,
          isBatch: false,
          isBatchParent: false,
          keys: ['connect'],
          parentKeys: [],
        },
      },
      {
        type: TokenType.Info,
        model: 'test',
        info: { model: 'test', groupModel: 'tests', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: true,
          isBatch: false,
          isBatchParent: false,
          keys: ['test'],
          parentKeys: ['connect'],
        },
        foreign: {
          key: 'id',
          reference: 'connect',
          referKey: 'testId',
          reverse: true,
        },
      },
      {
        type: TokenType.Info,
        model: 'model',
        info: { model: 'model', groupModel: 'models', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: true,
          isBatch: false,
          isBatchParent: false,
          keys: ['model'],
          parentKeys: ['connect'],
        },
        foreign: {
          key: 'id',
          reference: 'connect',
          referKey: 'modelId',
          reverse: true,
        },
      },
    ])
  })
})

describe('tokenizer with condition', () => {
  it('filter: find ont result', () => {
    const input = { test: { id: 11 } }
    const output = tokens(input)

    expect(output).toMatchObject([
      {
        type: TokenType.Info,
        model: 'test',
        info: { model: 'test', groupModel: 'tests', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: false,
          isBatch: false,
          isBatchParent: false,
          keys: ['test'],
          parentKeys: [],
        },

        filter: { id: 11 },
      },
    ])
  })

  it('field: alias primary', () => {
    const input = { test: { 'id': 11, '@field': 'id:idddddd' } }
    const output = tokens(input)

    expect(output).toMatchObject([
      {
        type: TokenType.Info,
        model: 'test',
        info: { model: 'test', groupModel: 'tests', isGroup: false },
        extra: {
          isGroup: false,
          isUnion: false,
          isBatch: false,
          isBatchParent: false,
          keys: ['test'],
          parentKeys: [],
        },

        fields: [{ field: 'id', alias: 'idddddd' }],
        filter: { id: 11 },
      },
    ])
  })
})
