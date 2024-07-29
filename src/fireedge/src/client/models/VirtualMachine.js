/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { stringToBoolean } from 'client/models/Helper'
import { isRelative } from 'client/models/Scheduler'
import {
  getSecurityGroupsFromResource,
  prettySecurityGroup,
} from 'client/models/SecurityGroup'

import {
  Disk,
  EXTERNAL_IP_ATTRS,
  HISTORY_ACTIONS,
  HistoryRecord,
  NIC_IP_ATTRS,
  Nic,
  NicAlias,
  STATES,
  ScheduleAction,
  Snapshot,
  VM,
  VM_ACTIONS_BY_STATE,
  VM_LCM_STATES,
  VM_STATES,
} from 'client/constants'

/**
 * This function removes, from the given list,
 * the Virtual machines in state DONE.
 *
 * @param {VM[]} vms - List of virtual machines
 * @returns {VM[]} Clean list of vms with done state
 */
export const filterDoneVms = (vms = []) =>
  vms.filter(({ STATE }) => VM_STATES[STATE]?.name !== STATES.DONE)

/**
 * @param {string|number} action - Action code
 * @returns {HISTORY_ACTIONS} History action name
 */
export const getHistoryAction = (action) => HISTORY_ACTIONS[+action]

/**
 * @param {VM} vm - Virtual machine
 * @returns {HistoryRecord[]} History records from resource
 */
export const getHistoryRecords = (vm) =>
  [vm?.HISTORY_RECORDS?.HISTORY ?? []].flat()

/**
 * @param {VM} vm - Virtual machine
 * @returns {HistoryRecord} Last history record from resource
 */
export const getLastHistory = (vm) => {
  const records = getHistoryRecords(vm)

  return records.at(-1) ?? {}
}

/**
 * @param {VM} vm - Virtual machine
 * @returns {string} Resource type: VR, FLOW or VM
 */
export const getType = (vm) =>
  vm.TEMPLATE?.VROUTER_ID !== undefined
    ? 'VR'
    : vm?.USER_TEMPLATE?.USER_TEMPLATE?.SERVICE_ID !== undefined
    ? 'FLOW'
    : 'VM'

/**
 * @param {VM} vm - Virtual machine
 * @returns {string} VM hypervisor from latest history record
 */
export const getHypervisor = (vm) => getLastHistory(vm)?.VM_MAD

/**
 * @param {VM} vm - Virtual machine
 * @returns {boolean} If the hypervisor is vCenter
 */
export const isVCenter = (vm) => getHypervisor(vm) === 'vcenter'

/**
 * @param {VM} vm - Virtual machine
 * @returns {STATES.StateInfo} State information from resource
 */
export const getState = (vm) => {
  const { STATE, LCM_STATE } = vm ?? {}
  const state = VM_STATES[+STATE]

  return state?.name === STATES.ACTIVE ? VM_LCM_STATES[+LCM_STATE] : state
}

/**
 * @param {VM} vm - Virtual machine
 * @returns {Disk[]} List of disks from resource
 */
export const getDisks = (vm) => {
  const { TEMPLATE = {}, MONITORING = {}, SNAPSHOTS = {} } = vm ?? {}
  const diskSnapshots = [SNAPSHOTS].flat().filter(Boolean)

  const { DISK, CONTEXT } = TEMPLATE
  const monitoringDiskSize = [MONITORING?.DISK_SIZE].flat().filter(Boolean)
  const monitoringSnapshotSize = [MONITORING?.SNAPSHOT_SIZE]
    .flat()
    .filter(Boolean)

  const addExtraData = (disk) => {
    const diskSnapshot =
      diskSnapshots.find(({ DISK_ID }) => DISK_ID === disk.DISK_ID)?.SNAPSHOT ||
      []

    const snapshotsWithMonitoringData = [diskSnapshot]
      .flat()
      .map((snapshot) => ({
        ...snapshot,
        MONITOR_SIZE:
          monitoringSnapshotSize.find(({ DISK_ID }) => DISK_ID === disk.DISK_ID)
            ?.SIZE || '-',
      }))

    const diskSizeFromMonitoring =
      monitoringDiskSize.find(({ ID }) => ID === disk.DISK_ID)?.SIZE || '-'

    return {
      ...disk,
      SNAPSHOTS: snapshotsWithMonitoringData,
      MONITOR_SIZE: diskSizeFromMonitoring,
    }
  }

  const contextDisk = CONTEXT &&
    !isVCenter(vm) && {
      ...CONTEXT,
      IMAGE: 'CONTEXT',
      IS_CONTEXT: true,
      DATASTORE: '-',
      READONLY: '-',
      SAVE: '-',
      CLONE: '-',
      SAVE_AS: '-',
    }

  return [DISK, contextDisk].flat().filter(Boolean).map(addExtraData)
}

/**
 * @param {VM} vm - Virtual machine
 * @param {object} [options] - Options
 * @param {boolean} [options.groupAlias]
 * - Create ALIAS attribute with result to mapping NIC_ALIAS and ALIAS_IDS
 * @param {boolean} [options.securityGroupsFromTemplate]
 * - Create SECURITY_GROUPS attribute with rules from TEMPLATE.SECURITY_GROUP_RULE
 * @returns {Nic[]} List of nics from resource
 */
export const getNics = (vm, options = {}) => {
  const { groupAlias = false, securityGroupsFromTemplate = false } = options
  const { TEMPLATE = {}, MONITORING = {} } = vm ?? {}
  const { NIC = [], NIC_ALIAS = [], PCI = [] } = TEMPLATE

  const PCI_ARRAY = Array.isArray(PCI) ? PCI : [PCI]
  const pciNics = PCI_ARRAY.filter(({ NIC_ID } = {}) => NIC_ID !== undefined)

  let nics = [NIC, NIC_ALIAS, pciNics].flat().filter(Boolean)

  // MONITORING data is not always available
  if (Object.keys(MONITORING).length > 0) {
    const externalIps = EXTERNAL_IP_ATTRS.map((externalAttribute) =>
      MONITORING[externalAttribute]?.split(',')
    )

    const ensuredExternalIps = [...externalIps].flat().filter(Boolean)
    const externalNics = ensuredExternalIps.map((externalIp) => ({
      NIC_ID: '_',
      IP: externalIp,
      NETWORK: 'Additional IP',
    }))

    nics = [...nics, ...externalNics]
  }

  if (groupAlias) {
    nics = nics
      .filter(({ PARENT }) => PARENT === undefined)
      .map(({ ALIAS_IDS, ...nic }) => ({
        ...nic,
        ALIAS: [NIC_ALIAS]
          .flat()
          .filter(({ NIC_ID }) => ALIAS_IDS?.split(',')?.includes?.(NIC_ID)),
      }))
  }

  if (securityGroupsFromTemplate) {
    nics = nics.map(({ SECURITY_GROUPS, ...nic }) => ({
      ...nic,
      SECURITY_GROUPS: getSecurityGroupsFromResource(vm, SECURITY_GROUPS)?.map(
        prettySecurityGroup
      ),
    }))
  }

  return nics
}

/**
 * @param {VM} vm - Virtual machine
 * @returns {Nic[]} List of pcis from resource
 */
export const getPcis = (vm) => {
  const { TEMPLATE = {} } = vm ?? {}
  const { PCI = [] } = TEMPLATE

  const PCI_ARRAY = Array.isArray(PCI) ? PCI : [PCI]
  const pcis = PCI_ARRAY.filter(({ TYPE } = {}) => TYPE !== 'NIC')

  return pcis
}

/**
 * @param {Nic} nic - NIC
 * @returns {string[]} Ips from resource
 */
export const getIpsFromNic = (nic) => {
  const ipAttributes = NIC_IP_ATTRS.filter((attr) => nic[attr] !== undefined)

  if (ipAttributes) {
    return [ipAttributes].flat().map((attribute) => nic[attribute])
  }
}

/**
 * @param {VM} vm - Virtual machine
 * @returns {string[]} List of ips from resource
 */
export const getIps = (vm) =>
  getNics(vm).map(getIpsFromNic).filter(Boolean).flat()

/**
 * @param {VM} vm - Virtual machine
 * @returns {{ nics: Nic[], alias: NicAlias[] }} Lists of nics and alias from resource
 */
export const splitNicAlias = (vm) =>
  getNics(vm).reduce(
    (result, nic) => {
      result[nic?.PARENT !== undefined ? 'alias' : 'nics'].push(nic)

      return result
    },
    { nics: [], alias: [] }
  )

/**
 * @param {VM} vm - Virtual machine
 * @returns {Nic} Nic from resource with port forwarding
 */
export const getNicWithPortForwarding = (vm) =>
  getNics(vm).find((nic) => nic.EXTERNAL_PORT_RANGE)

/**
 * @param {VM} vm - Virtual machine
 * @returns {Snapshot[]} List of snapshots from resource
 */
export const getSnapshotList = (vm) => {
  const { TEMPLATE = {} } = vm ?? {}

  return [TEMPLATE.SNAPSHOT].filter(Boolean).flat()
}

/**
 * @param {VM} vm - Virtual machine
 * @returns {ScheduleAction[]} List of schedule actions from resource
 */
export const getScheduleActions = (vm) => {
  const { STIME: vmStartTime, TEMPLATE = {} } = vm ?? {}
  const now = Math.round(Date.now() / 1000)

  return [TEMPLATE.SCHED_ACTION]
    .filter(Boolean)
    .flat()
    .map((action) => {
      const { TIME, WARNING } = action
      const isRelativeTime = isRelative(TIME)
      const isRelativeWarning = isRelative(WARNING)

      const ensuredTime = isRelativeTime ? +TIME + +vmStartTime : +TIME
      const ensuredWarn = isRelativeWarning && now > ensuredTime + +WARNING

      return { ...action, TIME: ensuredTime, WARNING: ensuredWarn }
    })
}

/**
 * Check if action is available for **all VMs**.
 *
 * @param {object} action - VM action
 * @param {VM|VM[]} vms - Virtual machines
 * @returns {boolean} If `true`, the action is available for all VMs
 */
export const isAvailableAction = (action, vms = []) =>
  [vms].flat().every((vm) => {
    const hypervisor = getHypervisor(vm)
    const state = VM_STATES[vm.STATE]?.name
    const lcmState = VM_LCM_STATES[vm.LCM_STATE]?.name

    if (VM_ACTIONS_BY_STATE[hypervisor]?.[action]?.length === 0) return true

    return (
      (state === STATES.ACTIVE &&
        // if action includes ACTIVE state,
        // it means that the action is available in all LCM states
        (VM_ACTIONS_BY_STATE[hypervisor]?.[action]?.includes(STATES.ACTIVE) ||
          VM_ACTIONS_BY_STATE[hypervisor]?.[action]?.includes(lcmState))) ||
      VM_ACTIONS_BY_STATE[hypervisor]?.[action]?.includes(state)
    )
  })

/**
 * @param {VM} vm - Virtual machine
 * @param {'ssh'|'rdp'} type - Connection type
 * @returns {boolean} - Returns connection type is available
 */
export const nicsIncludesTheConnectionType = (vm, type) => {
  const ensuredConnection = String(type).toUpperCase()

  if (!['SSH', 'RDP'].includes(ensuredConnection)) return false

  return getNics(vm).some((nic) => stringToBoolean(nic[ensuredConnection]))
}

/**
 * Scales the VCPU value by CPU factor to get the real CPU value.
 *
 * @param {number} [vcpu] - VCPU value
 * @param {number} cpuFactor - Factor CPU
 * @returns {number|undefined} Real CPU value
 */
export const scaleVcpuByCpuFactor = (vcpu, cpuFactor) => {
  if (!cpuFactor || isNaN(+vcpu) || +vcpu === 0) return
  if (+cpuFactor === 1) return vcpu

  // round 2 decimals to avoid floating point errors
  return Math.round(+vcpu * +cpuFactor * 100) / 100
}
