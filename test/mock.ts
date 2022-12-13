import { ApiManager } from '../src/api'

export const MOCK_DATA = {
  test: [
    { id: 1, data: 'test1' },
    { id: 2, data: 'test2' },
    { id: 3, data: 'test3' },
    { id: 4, data: 'test4' },
    { id: 5, data: 'test5' },
    { id: 6, data: 'test6' },
    { id: 7, data: 'test7' },
    { id: 8, data: 'test8' },
    { id: 9, data: 'test9' },
    { id: 10, data: 'test10' },
    { id: 11, data: 'test11' },
    { id: 12, data: 'test12' },
    { id: 13, data: 'test13' },
  ],
  model: [
    { id: 1, data: 'model1', testId: 2 },
    { id: 2, data: 'model2', testId: 1 },
    { id: 3, data: 'model3', testId: 3 },
    { id: 4, data: 'model4', testId: 4 },
  ],
  connect: [
    { id: 1, testId: 1, modelId: 1 },
    { id: 2, testId: 2, modelId: 2 },
    { id: 3, testId: 2, modelId: 3 },
  ],
}

ApiManager.registerModel({
  name: 'test',
  groupName: 'tests',
  desc: '',
  primary: 'id',
  parser: 'default',
  executor: 'memory',
  columns: [
    {
      key: 'id',
      type: 'number',
      desc: '',
      isPrimary: true,
    },
    {
      key: 'data',
      type: 'string',
      desc: '',
    },
  ],

  extra: {
    memory: MOCK_DATA.test,
  },
})

ApiManager.registerModel({
  name: 'model',
  groupName: 'models',
  desc: '',
  primary: 'id',
  parser: 'default',
  executor: 'memory',
  columns: [
    {
      key: 'id',
      type: 'number',
      desc: '',
      isPrimary: true,
    },
    {
      key: 'data',
      type: 'string',
      desc: '',
    },
    {
      key: 'testId',
      type: 'number',
      desc: '',
      isForeign: true,
    },
  ],
  foreigns: [
    {
      key: 'testId',
      reference: 'test',
      referKey: 'id',
    },
  ],

  extra: {
    memory: MOCK_DATA.model,
  },
})

ApiManager.registerModel({
  name: 'connect',
  groupName: 'connects',
  desc: '',
  primary: 'id',
  parser: 'default',
  executor: 'memory',
  columns: [
    {
      key: 'id',
      type: 'number',
      desc: '',
      isPrimary: true,
    },
    {
      key: 'testId',
      type: 'number',
      desc: '',
      isForeign: true,
    },
    {
      key: 'modelId',
      type: 'number',
      desc: '',
      isForeign: true,
    },
  ],
  foreigns: [
    {
      key: 'testId',
      reference: 'test',
      referKey: 'id',
    },
    {
      key: 'modelId',
      reference: 'model',
      referKey: 'id',
    },
  ],

  extra: {
    memory: MOCK_DATA.connect,
  },
})
