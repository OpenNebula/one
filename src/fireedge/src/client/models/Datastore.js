import { prettyBytes } from 'client/utils'
import { DATASTORE_STATES, DATASTORE_TYPES } from 'client/constants'

export const getType = ({ TYPE } = {}) => DATASTORE_TYPES[TYPE]

export const getState = ({ STATE } = {}) => DATASTORE_STATES[STATE]

export const getCapacityInfo = ({ TOTAL_MB, USED_MB } = {}) => {
  const percentOfUsed = +USED_MB * 100 / +TOTAL_MB || 0
  const usedBytes = prettyBytes(+USED_MB, 'MB')
  const totalBytes = prettyBytes(+TOTAL_MB, 'MB')
  const percentLabel = `${usedBytes} / ${totalBytes} (${Math.round(percentOfUsed)}%)`

  return { percentOfUsed, percentLabel }
}
