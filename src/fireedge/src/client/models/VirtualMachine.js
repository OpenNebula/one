import { STATES, VM_STATES, VM_LCM_STATES } from 'client/constants'

/* const EXTERNAL_IP_ATTRS = [
  'GUEST_IP',
  'GUEST_IP_ADDRESSES',
  'AWS_IP_ADDRESS',
  'AWS_PUBLIC_IP_ADDRESS',
  'AWS_PRIVATE_IP_ADDRESS',
  'AZ_IPADDRESS',
  'SL_PRIMARYIPADDRESS'
] */

const NIC_ALIAS_IP_ATTRS = [
  'IP',
  'IP6',
  'IP6_GLOBAL',
  'IP6_ULA',
  'VROUTER_IP',
  'VROUTER_IP6_GLOBAL',
  'VROUTER_IP6_ULA'
]

/**
 * @param {Array} vms List of virtual machines
 * @returns {Array} Clean list of vms with done state
 */
export const filterDoneVms = (vms = []) =>
  vms.filter(({ STATE }) => VM_STATES[STATE]?.name !== STATES.DONE)

/**
 * @param {Object} vm Virtual machine
 * @returns {Object} Last history record from resource
 */
export const getLastHistory = vm => {
  const history = vm?.HISTORY_RECORDS?.HISTORY ?? {}

  return Array.isArray(history) ? history[history.length - 1] : history
}

/**
 * @param {Object} vm Virtual machine
 * @returns {String} Resource type: VR, FLOW or VM
 */
export const getType = vm => vm.TEMPLATE?.VROUTER_ID
  ? 'VR' : vm?.USER_TEMPLATE?.USER_TEMPLATE?.SERVICE_ID ? 'FLOW' : 'VM'

/**
 * @param {Object} vm Virtual machine
 * @returns {String} Resource hypervisor
 */
export const getHypervisor = vm => String(getLastHistory(vm)?.VM_MAD).toLowerCase()

/**
 * @param {Object} vm Virtual machine
 * @returns {Boolean} If the hypervisor is vCenter
 */
export const isVCenter = vm => getHypervisor(vm) === 'vcenter'

/**
 * @type {{color: string, name: string, meaning: string}} StateInfo
 *
 * @param {Object} vm Virtual machine
 * @returns {StateInfo} State information from resource
 */
export const getState = ({ STATE, LCM_STATE } = {}) => {
  const state = VM_STATES[+STATE]

  return state?.name === STATES.ACTIVE ? VM_LCM_STATES[+LCM_STATE] : state
}

/**
 * @param {Object} vm Virtual machine
 * @returns {Array} List of disks from resource
 */
export const getDisks = ({ TEMPLATE = {}, MONITORING = {}, ...vm } = {}) => {
  const contextDisk = TEMPLATE.CONTEXT && !isVCenter(vm) && {
    ...TEMPLATE.CONTEXT,
    IMAGE: 'CONTEXT',
    DATASTORE: '-',
    TYPE: '-',
    READONLY: '-',
    SAVE: '-',
    CLONE: '-',
    SAVE_AS: '-'
  }

  const addMonitoringData = disk => ({
    ...disk,
    // get monitoring data
    MONITOR_SIZE: MONITORING.DISK_SIZE
      ?.find(({ ID }) => ID === disk.DISK_ID)?.SIZE || '-'
  })

  return [TEMPLATE.DISK, contextDisk]
    .flat()
    .filter(Boolean)
    .map(addMonitoringData)
}

/**
 * @param {Object} vm Virtual machine
 * @returns {Array} List of nics from resource
 */
export const getNics = ({ TEMPLATE = {}, MONITORING = {} } = {}) => {
  const { NIC = [], NIC_ALIAS = [], PCI = [] } = TEMPLATE
  const { GUEST_IP, GUEST_IP_ADDRESSES = '' } = MONITORING

  const extraIps = [GUEST_IP, ...GUEST_IP_ADDRESSES?.split(',')]
    .filter(Boolean)
    .map(ip => ({ NIC_ID: '-', IP: ip, NETWORK: 'Additional IP', BRIDGE: '-' }))

  return [NIC, NIC_ALIAS, PCI, extraIps].flat().filter(Boolean)
}

/**
 * @param {Object} vm Virtual machine
 * @returns {Array} List of ips from resource
 */
export const getIps = vm => {
  const getIpsFromNic = nic => NIC_ALIAS_IP_ATTRS.map(attr => nic[attr]).filter(Boolean)

  return getNics(vm).map(getIpsFromNic).flat()
}

/**
 * @type {{nics: Array, alias: Array}} Nics&Alias
 *
 * @param {Object} vm Virtual machine
 * @returns {Nics&Alias} Lists of nics and alias from resource
 */
export const splitNicAlias = vm => getNics(vm).reduce((result, nic) => {
  result[nic?.PARENT !== undefined ? 'alias' : 'nics'].push(nic)

  return result
}, { nics: [], alias: [] })
