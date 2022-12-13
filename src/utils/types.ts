export const TypeTag = {
  Boolean: '[object Boolean]',
  String: '[object String]',
  Number: '[object Number]',
  Null: '[object Null]',
  Symbol: '[object Symbol]',
  Object: '[object Object]',
  Array: '[object Array]',
  Map: '[object Map]',
  Set: '[object Set]',
  WeakMap: '[object WeakMap]',
  Args: '[object Arguments]',
  Date: '[object Date]',
  Error: '[object Error]',
  RegExp: '[object RegExp]',
}

export const isArray = Array.isArray

export const toString = Object.prototype.toString
export const toTypeString = (val: unknown): string => toString.call(val)
export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === TypeTag.Object
export const isInstanceOf = <T extends new (...args: any[]) => any>(
  val: unknown,
  type: T,
  isStrict: boolean,
): boolean => {
  if (!val || typeof val !== 'object')
    return false
  if (isStrict)
    return val.constructor === type
  return val instanceof type
}

export const isNull = (val: unknown): val is null => val === null
export const isNotNull = <T>(
  val: T | undefined,
): val is T extends undefined ? never : T => val !== null
export const isUndefined = (val: unknown): val is undefined =>
  typeof val === 'undefined'
export const isNotUndefined = <T>(
  val: T | undefined,
): val is T extends undefined ? never : T => typeof val !== 'undefined'

export const isBoolean = (val: unknown): val is boolean =>
  typeof val === 'boolean'
export const isNumber = (val: unknown): val is number =>
  typeof val === 'number'
export const isString = (val: unknown): val is string =>
  typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol =>
  typeof val === 'symbol'
export const isObject = (val: unknown): val is Record<any, any> =>
  val != null && typeof val === 'object'
export const isFunction = (val: unknown): val is (...args: any[]) => any =>
  typeof val === 'function'
export const isPromise = <T = any>(val: unknown): val is Promise<T> =>
  isObject(val) && isFunction(val.then) && isFunction(val.catch)

export const isConstructor = (val: any): boolean => val === 'constructor'
export const isNaN = (val: any): boolean => isNumber(val) && Number.isNaN(val)

// export const isAsyncFunction = (val: undefined) => false;

export const hasOwnProperty = (val: unknown, propKey: string): val is Record<any, any> =>
  isObject(val) && Object.prototype.hasOwnProperty.call(val, propKey)
