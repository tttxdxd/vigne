import { describe, expect, it } from 'vitest'
import { Vigne } from 'vigne'

import { MOCK_DATA } from './mock'

describe('query', () => {
  it('query empty', async () => {
    const input = {}
    const output = await Vigne.query(input)

    expect(output).toMatchObject({})
  })

  it('query undefined', async () => {
    const input = undefined
    const output = await Vigne.query(input as any)

    expect(output).toMatchObject({
      code: 1,
      msg: 'input error',
    })
  })

  it('query model: true', async () => {
    const input = { test: true }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: MOCK_DATA.test[0],
      },
    })
  })

  it('query model: {}', async () => {
    const input = { test: {} }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: MOCK_DATA.test[0],
      },
    })
  })

  it('query model: @model', async () => {
    const input = { alias: { '@model': 'test' } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        alias: MOCK_DATA.test[0],
      },
    })
  })

  it('query model with sub model', async () => {
    const input = { test: { model: {} } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: {
          ...MOCK_DATA.test[0],
          model: MOCK_DATA.model.find(v => v.testId === MOCK_DATA.test[0].id),
        },
      },
    })
  })

  it('query mutiple model', async () => {
    const input = { test: {}, model: {}, connect: {} }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: MOCK_DATA.test[0],
        model: MOCK_DATA.model[0],
        connect: MOCK_DATA.connect[0],
      },
    })
  })

  it('query model with two model', async () => {
    const input = { connect: { test: {}, model: {} } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        connect: {
          ...MOCK_DATA.connect[0],
          test: MOCK_DATA.test.find(v => v.id === MOCK_DATA.connect[0].testId),
          model: MOCK_DATA.model.find(v => v.id === MOCK_DATA.connect[0].modelId),
        },
      },
    })
  })
})

describe('query with condition', () => {
  it('filter: find ont result', async () => {
    const input = { test: { id: 11 } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: MOCK_DATA.test.find(v => v.id === input.test.id),
      },
    })
  })

  it('query model: @model', async () => {
    const input = { alias: { '@model': 'test', 'id': 11 } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        alias: MOCK_DATA.test.find(v => v.id === input.alias.id),
      },
    })
  })

  it('filter: cant find result', async () => {
    const input = { test: { id: 101 } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: {
          ...MOCK_DATA.test.find(v => v.id === input.test.id),
        },
      },
    })
  })

  it('filter: cant find result', async () => {
    const input = { test: { id: 10, model: true } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: {
          ...MOCK_DATA.test.find(v => v.id === input.test.id),
          model: MOCK_DATA.model.find(v => v.testId === input.test.id),
        },
      },
    })
  })

  it('filter: cant find result', async () => {
    const input = { test: { id: 101, model: true }, model: {} }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        model: MOCK_DATA.model[0],
      },
    })
  })

  it('filter: find many result', async () => {
    const input = { test: { id: [1, 2, 3], model: true }, model: {} }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        model: MOCK_DATA.model[0],
      },
    })
  })

  it('field: alias primary', async () => {
    const input = { test: { 'id': 11, '@field': 'id:idddddd' } }
    const output = await Vigne.query(input)

    expect(output).toMatchObject({
      data: {
        test: {
          idddddd: input.test.id,
        },
      },
    })
  })
})
