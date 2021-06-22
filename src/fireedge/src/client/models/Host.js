import { prettyBytes } from 'client/utils'
import { HOST_STATES } from 'client/constants'

export const getState = ({ STATE } = {}) => HOST_STATES[STATE]

export const getAllocatedInfo = ({ HOST_SHARE = {} } = {}) => {
  const { CPU_USAGE, TOTAL_CPU, MEM_USAGE, TOTAL_MEM } = HOST_SHARE

  const percentCpuUsed = +CPU_USAGE * 100 / +TOTAL_CPU || 0
  const percentCpuLabel = `${CPU_USAGE} / ${TOTAL_CPU} (${Math.round(percentCpuUsed)}%)`

  const percentMemUsed = +MEM_USAGE * 100 / +TOTAL_MEM || 0
  const usedMemBytes = prettyBytes(+MEM_USAGE)
  const totalMemBytes = prettyBytes(+TOTAL_MEM)
  const percentMemLabel = `${usedMemBytes} / ${totalMemBytes} (${Math.round(percentMemUsed)}%)`

  return {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel
  }
}
