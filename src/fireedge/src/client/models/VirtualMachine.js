import { STATES, VM_STATES, VM_LCM_STATES } from 'client/constants'

const EXTERNAL_IP_ATTRS = [
  'GUEST_IP',
  'GUEST_IP_ADDRESSES',
  'AWS_IP_ADDRESS',
  'AWS_PUBLIC_IP_ADDRESS',
  'AWS_PRIVATE_IP_ADDRESS',
  'AZ_IPADDRESS',
  'SL_PRIMARYIPADDRESS'
]

const NIC_ALIAS_IP_ATTRS = [
  'IP',
  'IP6',
  'IP6_GLOBAL',
  'IP6_ULA',
  'VROUTER_IP',
  'VROUTER_IP6_GLOBAL',
  'VROUTER_IP6_ULA'
]

export const filterDoneVms = (vms = []) =>
  vms.filter(({ STATE }) => VM_STATES[STATE]?.name !== STATES.DONE)

export const getState = ({ STATE, LCM_STATE } = {}) => {
  const state = VM_STATES[+STATE]

  return state?.name === STATES.ACTIVE ? VM_LCM_STATES[+LCM_STATE] : state
}

export const getIps = ({ TEMPLATE = {} } = {}) => {
  const { NIC = [], PCI = [] } = TEMPLATE
  // TODO: add monitoring ips

  const nics = [NIC, PCI].flat()

  return nics
    .map(nic => NIC_ALIAS_IP_ATTRS.map(attr => nic[attr]).filter(Boolean))
    .flat()
}

const getNicsFromMonitoring = ({ ID }) => {
  const monitoringPool = {} // _getMonitoringPool()
  const monitoringVM = monitoringPool[ID]

  if (!monitoringPool || Object.keys(monitoringPool).length === 0 || !monitoringVM) return []

  return EXTERNAL_IP_ATTRS.reduce(function (externalNics, attr) {
    const monitoringValues = monitoringVM[attr]

    if (monitoringValues) {
      monitoringValues.split(',').forEach((_, ip) => {
        const exists = externalNics.some(nic => nic.IP === ip)

        if (!exists) {
          externalNics.push({ NIC_ID: '_', IP: ip })
        }
      })
    }

    return externalNics
  }, [])
}
