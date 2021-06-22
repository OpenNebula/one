import { prettyBytes } from 'client/utils'
import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

const MARKETPLACE_STATES = [
  { // 0
    name: STATES.ENABLED,
    color: COLOR.success.main
  },
  { // 1
    name: STATES.DISABLED,
    color: COLOR.debug.main
  }
]

export const getState = ({ STATE } = {}) => MARKETPLACE_STATES[+STATE]

export const getCapacityInfo = ({ TOTAL_MB, USED_MB } = {}) => {
  const percentOfUsed = +USED_MB * 100 / +TOTAL_MB || 0
  const usedBytes = prettyBytes(+USED_MB, 'MB')
  const totalBytes = prettyBytes(+TOTAL_MB, 'MB')
  const percentLabel = `${usedBytes} / ${totalBytes} (${Math.round(percentOfUsed)}%)`

  return { percentOfUsed, percentLabel }
}
