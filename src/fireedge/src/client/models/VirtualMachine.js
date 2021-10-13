/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { getSecurityGroupsFromResource, prettySecurityGroup } from 'client/models/SecurityGroup'
import { timeToString } from 'client/models/Helper'
import { Tr } from 'client/components/HOC'

import {
  STATES,
  VM_ACTIONS_BY_STATE,
  VM_STATES,
  VM_LCM_STATES,
  NIC_ALIAS_IP_ATTRS,
  HISTORY_ACTIONS,
  HYPERVISORS,
  T,
  StateInfo
} from 'client/constants'

/**
 * This function removes, from the given list,
 * the Virtual machines in state DONE.
 *
 * @param {Array} vms - List of virtual machines
 * @returns {Array} Clean list of vms with done state
 */
export const filterDoneVms = (vms = []) =>
  vms.filter(({ STATE }) => VM_STATES[STATE]?.name !== STATES.DONE)

/**
 * @param {string|number} action - Action code
 * @returns {HISTORY_ACTIONS} History action name
 */
export const getHistoryAction = action => HISTORY_ACTIONS[+action]

/**
 * @param {object} vm - Virtual machine
 * @returns {object} History records from resource
 */
export const getHistoryRecords = vm =>
  [vm?.HISTORY_RECORDS?.HISTORY ?? []].flat()

/**
 * @param {object} vm - Virtual machine
 * @returns {object} Last history record from resource
 */
export const getLastHistory = vm => {
  const records = getHistoryRecords(vm)

  return records.at(-1) ?? {}
}

/**
 * @param {object} vm - Virtual machine
 * @returns {string} Resource type: VR, FLOW or VM
 */
export const getType = vm => vm.TEMPLATE?.VROUTER_ID
  ? 'VR' : vm?.USER_TEMPLATE?.USER_TEMPLATE?.SERVICE_ID ? 'FLOW' : 'VM'

/**
 * @param {object} vm - Virtual machine
 * @returns {string} Resource hypervisor
 */
export const getHypervisor = vm => String(getLastHistory(vm)?.VM_MAD).toLowerCase()

/**
 * @param {object} vm - Virtual machine
 * @returns {boolean} If the hypervisor is vCenter
 */
export const isVCenter = vm => getHypervisor(vm) === HYPERVISORS.vcenter

/**
 * @param {object} vm - Virtual machine
 * @returns {StateInfo} State information from resource
 */
export const getState = vm => {
  const { STATE, LCM_STATE } = vm ?? {}
  const state = VM_STATES[+STATE]

  return state?.name === STATES.ACTIVE ? VM_LCM_STATES[+LCM_STATE] : state
}

/**
 * @param {object} vm - Virtual machine
 * @returns {Array} List of disks from resource
 */
export const getDisks = vm => {
  const { TEMPLATE = {}, MONITORING = {}, SNAPSHOTS = {} } = vm ?? {}
  const diskSnapshots = [SNAPSHOTS].flat().filter(Boolean)

  const { DISK, CONTEXT } = TEMPLATE
  const monitoringDiskSize = [MONITORING?.DISK_SIZE].flat().filter(Boolean)
  const monitoringSnapshotSize = [MONITORING?.SNAPSHOT_SIZE].flat().filter(Boolean)

  const addExtraData = disk => {
    const diskSnapshot = diskSnapshots
      .find(({ DISK_ID }) => DISK_ID === disk.DISK_ID)?.SNAPSHOT || []

    const snapshotsWithMonitoringData = [diskSnapshot]
      .flat()
      .map(snapshot => ({
        ...snapshot,
        MONITOR_SIZE: monitoringSnapshotSize
          .find(({ DISK_ID }) => DISK_ID === disk.DISK_ID)?.SIZE || '-'
      }))

    const diskSizeFromMonitoring = monitoringDiskSize
      .find(({ ID }) => ID === disk.DISK_ID)?.SIZE || '-'

    return {
      ...disk,
      SNAPSHOTS: snapshotsWithMonitoringData,
      MONITOR_SIZE: diskSizeFromMonitoring
    }
  }

  const contextDisk = CONTEXT && !isVCenter(vm) && {
    ...CONTEXT,
    IMAGE: 'CONTEXT',
    IS_CONTEXT: true,
    DATASTORE: '-',
    READONLY: '-',
    SAVE: '-',
    CLONE: '-',
    SAVE_AS: '-'
  }

  return [DISK, contextDisk]
    .flat()
    .filter(Boolean)
    .map(addExtraData)
}

/**
 * @param {object} vm - Virtual machine
 * @param {object} [options] - Options
 * @param {boolean} [options.groupAlias]
 * - Create ALIAS attribute with result to mapping NIC_ALIAS and ALIAS_IDS
 * @param {boolean} [options.securityGroupsFromTemplate]
 * - Create SECURITY_GROUPS attribute with rules from TEMPLATE.SECURITY_GROUP_RULE
 * @returns {object[]} List of nics from resource
 */
export const getNics = (vm, options = {}) => {
  const { groupAlias = false, securityGroupsFromTemplate = false } = options
  const { TEMPLATE = {}, MONITORING = {} } = vm ?? {}

  const { NIC = [], NIC_ALIAS = [], PCI = [] } = TEMPLATE
  const { GUEST_IP, GUEST_IP_ADDRESSES = '' } = MONITORING

  const extraIps = [GUEST_IP, ...GUEST_IP_ADDRESSES?.split(',')]
    .filter(Boolean)
    .map(ip => ({ NIC_ID: '-', IP: ip, NETWORK: 'Additional IP', BRIDGE: '-' }))

  let nics = [NIC, NIC_ALIAS, PCI, extraIps].flat().filter(Boolean)

  if (groupAlias) {
    nics = nics
      .filter(({ PARENT }) => PARENT === undefined)
      .map(({ ALIAS_IDS, ...nic }) => ({
        ...nic,
        ALIAS: [NIC_ALIAS]
          .flat()
          .filter(({ NIC_ID }) => ALIAS_IDS?.split(',')?.includes?.(NIC_ID))
      }))
  }

  if (securityGroupsFromTemplate) {
    nics = nics.map(({ SECURITY_GROUPS, ...nic }) => ({
      ...nic,
      SECURITY_GROUPS:
        getSecurityGroupsFromResource(vm, SECURITY_GROUPS)
          ?.map(prettySecurityGroup)
    }))
  }

  return nics
}

/**
 * @param {object} vm - Virtual machine
 * @returns {Array} List of ips from resource
 */
export const getIps = vm => {
  const getIpsFromNic = nic => NIC_ALIAS_IP_ATTRS.map(attr => nic[attr]).filter(Boolean)

  return getNics(vm).map(getIpsFromNic).flat()
}

/**
 * @param {object} vm - Virtual machine
 * @returns {{ nics: Array, alias: Array }} Lists of nics and alias from resource
 */
export const splitNicAlias = vm =>
  getNics(vm).reduce((result, nic) => {
    result[nic?.PARENT !== undefined ? 'alias' : 'nics'].push(nic)

    return result
  }, { nics: [], alias: [] })

/**
 * @param {object} vm - Virtual machine
 * @returns {Array} List of snapshots from resource
 */
export const getSnapshotList = vm => {
  const { TEMPLATE = {} } = vm ?? {}

  return [TEMPLATE.SNAPSHOT].filter(Boolean).flat()
}

/**
 * @param {object} vm - Virtual machine
 * @returns {Array} List of schedule actions from resource
 */
export const getScheduleActions = vm => {
  const { TEMPLATE = {} } = vm ?? {}

  return [TEMPLATE.SCHED_ACTION].filter(Boolean).flat()
}

/**
 * Converts the periodicity of the action to string value.
 *
 * @param {object} scheduleAction - Schedule action
 * @returns {{repeat: string|string[], end: string}} - Periodicity of the action.
 */
export const periodicityToString = scheduleAction => {
  const { REPEAT, DAYS = '', END_TYPE, END_VALUE = '' } = scheduleAction ?? {}

  const daysOfWeek = [T.Sun, T.Mon, T.Tue, T.Wed, T.Thu, T.Fri, T.Sat]
  const days = DAYS?.split(',')?.map(day => Tr(daysOfWeek[day])) ?? []

  const repeat = {
    0: `${Tr(T.Weekly)} ${days.join(',')}`,
    1: `${Tr(T.Monthly)} ${DAYS}`,
    2: `${Tr(T.Yearly)} ${DAYS}`,
    3: Tr([T.EachHours, DAYS])
  }[+REPEAT]

  const end = {
    0: Tr(T.None),
    1: Tr([T.AfterTimes, END_VALUE]),
    2: `${Tr(T.On)} ${timeToString(END_VALUE)}`
  }[+END_TYPE]

  return { repeat, end }
}

/**
 * Returns `true` if action is available by VM state.
 *
 * @param {object} action - VM action
 * @returns {function(Array, Function):boolean}
 * - The list of vms that will be perform the action
 */
export const isAvailableAction = action => (vms = [], getVmState = vm => getState(vm)?.name) => {
  if (VM_ACTIONS_BY_STATE[action]?.length === 0) return false

  const states = [vms].flat().map(getVmState)

  return states?.some(state => !VM_ACTIONS_BY_STATE[action]?.includes(state))
}
