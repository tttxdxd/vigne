import { isUndefined } from '.'

export function pick(origin: any, props?: string[]) {
  if (isUndefined(props) || props.length === 0)
    return origin

  return props.reduce<any>((map, prop) => {
    map[prop] = origin[prop]
    return map
  }, {})
}

export function set(origin: any, path: string[], value: any) {
  if (typeof origin !== 'object')
    return origin

  const len = path.length
  const lastIndex = len - 1
  let nested = origin
  for (let i = 0; i < lastIndex; i++) {
    const key = path[i]
    const value = nested[key]

    if (isUndefined(value))
      nested[key] = {}

    nested = nested[key]
  }

  nested[path[lastIndex]] = value

  return origin
}
