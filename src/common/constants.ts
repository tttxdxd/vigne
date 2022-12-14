import type { IOutput } from '../types'
import { ApiCode } from './enum'

export const API_OUTPUT: Record<ApiCode, IOutput> = {
  [ApiCode.InputError]: { code: ApiCode.InputError, msg: 'input error' },
}
