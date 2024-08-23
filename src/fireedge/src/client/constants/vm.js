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
import { T } from 'client/constants'
import * as ACTIONS from 'client/constants/actions'
import COLOR from 'client/constants/color'
import * as STATES from 'client/constants/states'
// eslint-disable-next-line no-unused-vars
import { LockInfo, Permissions } from 'client/constants/common'
// eslint-disable-next-line no-unused-vars
import { ScheduleAction } from 'client/constants/scheduler'

/**
 * @typedef {object} Disk
 * @property {string} [VCENTER_DS_REF] -
 * @property {string} [VCENTER_INSTANCE_ID] -
 */

/**
 * @typedef {object} Nic
 * @property {string} [VCENTER_INSTANCE_ID] -
 * @property {string} [VCENTER_NET_REF] -
 * @property {string} [VCENTER_PORTGROUP_TYPE] -
 */

/**
 * @typedef {object} NicAlias
 * @property {string} ALIAS_ID -
 * @property {string} PARENT -
 * @property {string} PARENT_ID -
 * @property {string} [VCENTER_INSTANCE_ID] -
 * @property {string} [VCENTER_NET_REF] -
 * @property {string} [VCENTER_PORTGROUP_TYPE] -
 */

/**
 * @typedef {object} DiskSize
 * @property {string|number} ID -
 * @property {string|number} SIZE -
 */

/**
 * @typedef {object} Graphics
 * @property {string|number} LISTEN -
 * @property {string} RANDOM_PASSW -
 * @property {string} TYPE -
 */

/**
 * @typedef {object} HistoryRecord
 * @property {string|number} OID -
 * @property {string|number} SEQ -
 * @property {string} HOSTNAME -
 * @property {string|number} HID -
 * @property {string|number} CID -
 * @property {string|number} STIME -
 * @property {string|number} ETIME -
 * @property {string} VM_MAD -
 * @property {string} TM_MAD -
 * @property {string|number} DS_ID -
 * @property {string|number} PSTIME -
 * @property {string|number} PETIME -
 * @property {string|number} RSTIME -
 * @property {string|number} RETIME -
 * @property {string|number} ESTIME -
 * @property {string|number} EETIME -
 * @property {VM_ACTIONS} ACTION -
 * @property {string|number} UID -
 * @property {string|number} GID -
 * @property {string|number} REQUEST_ID -
 */

/**
 * @typedef {object} HistoryShortRecord
 * @property {string|number} OID -
 * @property {string|number} SEQ -
 * @property {string} HOSTNAME -
 * @property {string|number} HID -
 * @property {string|number} CID -
 * @property {string} VM_MAD -
 * @property {string} TM_MAD -
 * @property {string|number} DS_ID -
 * @property {VM_ACTIONS} ACTION -
 */

/**
 * @typedef {object} DiskSnapshots
 * @property {string|number} ALLOW_ORPHANS -
 * @property {string|number} CURRENT_BASE -
 * @property {string|number} DISK_ID -
 * @property {string|number} NEXT_SNAPSHOT -
 * @property {DiskSnapshot|DiskSnapshot[]} [SNAPSHOT] -
 */

/**
 * @typedef {object} DiskSnapshot
 * @property {string|number} ID -
 * @property {string|number} DATE -
 * @property {string|number} PARENT -
 * @property {string|number} SIZE -
 * @property {string} [NAME] -
 * @property {string} [ACTIVE] -
 * @property {string} [CHILDREN] -
 */

/**
 * @typedef {object} Snapshot
 * @property {string} SNAPSHOT_ID -
 * @property {string} NAME -
 * @property {string} TIME -
 * @property {string} HYPERVISOR_ID -
 * @property {string} SYSTEM_DISK_SIZE -
 * @property {string} [ACTIVE] -
 * @property {string} [ACTION] -
 */

/**
 * @typedef {object} VM
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} UID - User id
 * @property {string|number} GID - Group id
 * @property {string} UNAME - User name
 * @property {string} GNAME - Group name
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {string|number} LAST_POLL - Last poll
 * @property {string|number} STATE - Current state
 * @property {string|number} LCM_STATE - Current LCM state
 * @property {string|number} PREV_STATE - Previous state
 * @property {string|number} PREV_LCM_STATE - Previous LCM state
 * @property {string|number} STIME - Start time
 * @property {string|number} ETIME - End time
 * @property {string|number} DEPLOY_ID - Deploy id
 * @property {LockInfo} [LOCK] - Lock information
 * @property {object} MONITORING - Monitoring information
 * @property {number} [MONITORING.CPU] - Percentage of 1 CPU consumed (two fully consumed cpu is 2.0)
 * @property {number} [MONITORING.DISKRDBYTES] - Amount of bytes read from disk
 * @property {number} [MONITORING.DISKRDIOPS] - Number of IO read operations
 * @property {number} [MONITORING.DISKWRBYTES] - Amount of bytes written to disk
 * @property {number} [MONITORING.DISKWRIOPS] - Number of IO write operations
 * @property {DiskSize|DiskSize[]} [MONITORING.DISK_SIZE] - Disk size details
 * @property {number} [MONITORING.ID] - ID of the VM
 * @property {number} [MONITORING.MEMORY] - Consumption in kilobytes
 * @property {number} [MONITORING.NETRX] - Received bytes from the network
 * @property {number} [MONITORING.NETTX] - Sent bytes to the network
 * @property {number} [MONITORING.TIMESTAMP] - Exact time when monitoring info were retrieved
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.AUTOMATIC_DS_REQUIREMENTS] -
 * @property {string} [TEMPLATE.AUTOMATIC_NIC_REQUIREMENTS] -
 * @property {string} [TEMPLATE.AUTOMATIC_REQUIREMENTS] -
 * @property {string} [TEMPLATE.CLONING_TEMPLATE_ID] -
 * @property {string} [TEMPLATE.CONTEXT] -
 * @property {string} [TEMPLATE.CPU] -
 * @property {string} [TEMPLATE.CPU_COST] -
 * @property {Disk|Disk[]} [TEMPLATE.DISK] -
 * @property {string} [TEMPLATE.DISK_COST] -
 * @property {string} [TEMPLATE.EMULATOR] -
 * @property {any} [TEMPLATE.FEATURES] -
 * @property {any} [TEMPLATE.HYPERV_OPTIONS] -
 * @property {Graphics} [TEMPLATE.GRAPHICS] -
 * @property {string} [TEMPLATE.IMPORTED] -
 * @property {any} [TEMPLATE.INPUT] -
 * @property {string} [TEMPLATE.MEMORY] -
 * @property {string} [TEMPLATE.MEMORY_COST] -
 * @property {string} [TEMPLATE.MEMORY_MAX] -
 * @property {string} [TEMPLATE.MEMORY_SLOTS] -
 * @property {Nic|Nic[]} [TEMPLATE.NIC] -
 * @property {NicAlias|NicAlias[]} [TEMPLATE.NIC_ALIAS] -
 * @property {any} [TEMPLATE.NIC_DEFAULT] -
 * @property {any} [TEMPLATE.NUMA_NODE] -
 * @property {any} [TEMPLATE.OS] -
 * @property {any} [TEMPLATE.PCI] -
 * @property {any} [TEMPLATE.RAW] -
 * @property {ScheduleAction|ScheduleAction[]} [TEMPLATE.SCHED_ACTION] -
 * @property {Snapshot|Snapshot[]} [TEMPLATE.SNAPSHOT] -
 * @property {any} [TEMPLATE.SECURITY_GROUP_RULE] -
 * @property {any} [TEMPLATE.SPICE_OPTIONS] -
 * @property {string} [TEMPLATE.SUBMIT_ON_HOLD] -
 * @property {string} [TEMPLATE.TEMPLATE_ID] -
 * @property {string} TEMPLATE.TM_MAD_SYSTEM -
 * @property {any} [TEMPLATE.TOPOLOGY] -
 * @property {string} [TEMPLATE.VCPU] -
 * @property {string} [TEMPLATE.VCPU_MAX] -
 * @property {object|object[]} [TEMPLATE.VMGROUP] -
 * @property {string} TEMPLATE.VMID -
 * @property {string} [TEMPLATE.VROUTER_ID] -
 * @property {string} [TEMPLATE.VROUTER_KEEPALIVED_ID] -
 * @property {string} [TEMPLATE.VROUTER_KEEPALIVED_PASSWORD] -
 * @property {object} USER_TEMPLATE -
 * @property {string} [USER_TEMPLATE.ERROR] -
 * @property {string} [USER_TEMPLATE.HYPERVISOR] -
 * @property {string} [USER_TEMPLATE.LOGO] -
 * @property {string} [USER_TEMPLATE.INFO] -
 * @property {string} [USER_TEMPLATE.SCHED_REQUIREMENTS] -
 * @property {string} [USER_TEMPLATE.VCENTER_CCR_REF] -
 * @property {string} [USER_TEMPLATE.VCENTER_DS_REF] -
 * @property {string} [USER_TEMPLATE.VCENTER_INSTANCE_ID] -
 * @property {object} HISTORY_RECORDS - History
 * @property {HistoryRecord|HistoryRecord[]} [HISTORY_RECORDS.HISTORY] - History Records
 * @property {DiskSnapshots|DiskSnapshots[]} [SNAPSHOTS] -
 */

/** @type {STATES.StateInfo[]} Virtual machine states */
export const VM_STATES = [
  {
    // 0
    name: STATES.INIT,
    color: COLOR.info.light,
    meaning: '',
  },
  {
    // 1
    name: STATES.PENDING,
    color: COLOR.info.light,
    meaning: '',
  },
  {
    // 2
    name: STATES.HOLD,
    color: COLOR.error.light,
    meaning: '',
  },
  {
    // 3
    name: STATES.ACTIVE,
    color: COLOR.success.light,
    meaning: '',
  },
  {
    // 4
    name: STATES.STOPPED,
    color: COLOR.error.light,
    meaning: '',
  },
  {
    // 5
    name: STATES.SUSPENDED,
    color: COLOR.error.light,
    meaning: '',
  },
  {
    // 6
    name: STATES.DONE,
    color: COLOR.debug.light,
    meaning: '',
  },
  {
    // 7
    name: STATES.FAILED,
    color: COLOR.error.dark,
    meaning: '',
  },
  {
    // 8
    name: STATES.POWEROFF,
    color: COLOR.error.light,
    meaning: '',
  },
  {
    // 9
    name: STATES.UNDEPLOYED,
    color: COLOR.error.light,
    meaning: '',
  },
  {
    // 10
    name: STATES.CLONING,
    color: COLOR.info.light,
    meaning: '',
  },
  {
    // 11
    name: STATES.CLONING_FAILURE,
    color: COLOR.error.dark,
    meaning: '',
  },
]

/** @type {STATES.StateInfo[]} Virtual machine lcm states */
export const VM_LCM_STATES = [
  {
    // 0
    name: STATES.LCM_INIT,
    color: COLOR.info.main,
    meaning: '',
    displayName: STATES.PROLOG,
  },
  {
    // 1
    name: STATES.PROLOG,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 2
    name: STATES.BOOT,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 3
    name: STATES.RUNNING,
    color: COLOR.success.main,
    meaning: '',
  },
  {
    // 4
    name: STATES.MIGRATE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 5
    name: STATES.SAVE_STOP,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 6
    name: STATES.SAVE_SUSPEND,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 7
    name: STATES.SAVE_MIGRATE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 8
    name: STATES.PROLOG_MIGRATE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 9
    name: STATES.PROLOG_RESUME,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 10
    name: STATES.EPILOG_STOP,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 11
    name: STATES.EPILOG,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 12
    name: STATES.SHUTDOWN,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 13
    name: STATES.CANCEL,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 14
    name: STATES.FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 15
    name: STATES.CLEANUP_RESUBMIT,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 16
    name: STATES.UNKNOWN,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 17
    name: STATES.HOTPLUG,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 18
    name: STATES.SHUTDOWN_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 19
    name: STATES.BOOT_UNKNOWN,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 20
    name: STATES.BOOT_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 21
    name: STATES.BOOT_SUSPENDED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 22
    name: STATES.BOOT_STOPPED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 23
    name: STATES.CLEANUP_DELETE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 24
    name: STATES.HOTPLUG_SNAPSHOT,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 25
    name: STATES.HOTPLUG_NIC,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 26
    name: STATES.HOTPLUG_SAVEAS,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 27
    name: STATES.HOTPLUG_SAVEAS_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 28
    name: STATES.HOTPLUG_SAVEAS_SUSPENDED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 29
    name: STATES.SHUTDOWN_UNDEPLOY,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 30
    name: STATES.EPILOG_UNDEPLOY,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 31
    name: STATES.PROLOG_UNDEPLOY,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 32
    name: STATES.BOOT_UNDEPLOY,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 33
    name: STATES.HOTPLUG_PROLOG_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 34
    name: STATES.HOTPLUG_EPILOG_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 35
    name: STATES.BOOT_MIGRATE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 36
    name: STATES.BOOT_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 37
    name: STATES.BOOT_MIGRATE_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 38
    name: STATES.PROLOG_MIGRATE_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 39
    name: STATES.PROLOG_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 40
    name: STATES.EPILOG_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 41
    name: STATES.EPILOG_STOP_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 42
    name: STATES.EPILOG_UNDEPLOY_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 43
    name: STATES.PROLOG_MIGRATE_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 44
    name: STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 45
    name: STATES.PROLOG_MIGRATE_SUSPEND,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 46
    name: STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 47
    name: STATES.BOOT_UNDEPLOY_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 48
    name: STATES.BOOT_STOPPED_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 49
    name: STATES.PROLOG_RESUME_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 50
    name: STATES.PROLOG_UNDEPLOY_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 51
    name: STATES.DISK_SNAPSHOT_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 52
    name: STATES.DISK_SNAPSHOT_REVERT_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 53
    name: STATES.DISK_SNAPSHOT_DELETE_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 54
    name: STATES.DISK_SNAPSHOT_SUSPENDED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 55
    name: STATES.DISK_SNAPSHOT_REVERT_SUSPENDED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 56
    name: STATES.DISK_SNAPSHOT_DELETE_SUSPENDED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 57
    name: STATES.DISK_SNAPSHOT,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 58
    name: STATES.DISK_SNAPSHOT_REVERT,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 59
    name: STATES.DISK_SNAPSHOT_DELETE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 60
    name: STATES.PROLOG_MIGRATE_UNKNOWN,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 61
    name: STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    // 62
    name: STATES.DISK_RESIZE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 63
    name: STATES.DISK_RESIZE_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 64
    name: STATES.DISK_RESIZE_UNDEPLOYED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 65
    name: STATES.HOTPLUG_NIC_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 66
    name: STATES.HOTPLUG_RESIZE,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 67
    name: STATES.HOTPLUG_SAVEAS_UNDEPLOYED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 68
    name: STATES.HOTPLUG_SAVEAS_STOPPED,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 69
    name: STATES.BACKUP,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 70
    name: STATES.BACKUP_POWEROFF,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 71
    name: STATES.RESTORE,
    color: COLOR.info.main,
    meaning: '',
  },
]

/** @enum {string} Virtual machine actions */
export const VM_ACTIONS = {
  BACKUP: 'backup',
  RESTORE: 'restore',
  CREATE_DIALOG: 'create_dialog',
  CREATE_APP_DIALOG: 'create_app_dialog',
  DEPLOY: 'deploy',
  HOLD: 'hold',
  LOCK: 'lock',
  MIGRATE_LIVE: 'live-migrate',
  MIGRATE_POFF_HARD: 'poweroff-hard-migrate',
  MIGRATE_POFF: 'poweroff-migrate',
  MIGRATE: 'migrate',
  POWEROFF_HARD: 'poweroff-hard',
  POWEROFF: 'poweroff',
  REBOOT_HARD: 'reboot-hard',
  REBOOT: 'reboot',
  RECOVER: 'recover',
  RELEASE: 'release',
  RESCHED: 'resched',
  RESUME: 'resume',
  SAVE_AS_TEMPLATE: 'save_as_template',
  STOP: 'stop',
  SUSPEND: 'suspend',
  TERMINATE_HARD: 'terminate-hard',
  TERMINATE: 'terminate',
  UNDEPLOY_HARD: 'undeploy-hard',
  UNDEPLOY: 'undeploy',
  UNLOCK: 'unlock',
  UNRESCHED: 'unresched',

  // REMOTE
  SPICE: 'spice',
  VNC: 'vnc',
  SSH: 'ssh',
  RDP: 'rdp',
  FILE_RDP: 'file_rdp',
  FILE_VIRT_VIEWER: 'file_virt_viewer',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_MODE: ACTIONS.CHANGE_MODE,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,

  // CAPACITY
  RESIZE_CAPACITY: 'resize',

  // STORAGE
  ATTACH_DISK: 'disk-attach',
  DETACH_DISK: 'disk-detach',
  SNAPSHOT_DISK_CREATE: 'disk-snapshot-create',
  SNAPSHOT_DISK_RENAME: 'disk-snapshot-rename',
  SNAPSHOT_DISK_REVERT: 'disk-snapshot-revert',
  SNAPSHOT_DISK_DELETE: 'disk-snapshot-delete',
  RESIZE_DISK: 'disk-resize',
  DISK_SAVEAS: 'disk-saveas',

  // NETWORK
  ATTACH_NIC: 'nic-attach',
  DETACH_NIC: 'nic-detach',
  UPDATE_NIC: 'nic-update',
  ATTACH_SEC_GROUP: 'sg-attach',
  DETACH_SEC_GROUP: 'sg-detach',

  // PCI
  ATTACH_PCI: 'pci-attach',
  DETACH_PCI: 'pci-detach',

  // SNAPSHOT
  SNAPSHOT_CREATE: 'snapshot-create',
  SNAPSHOT_REVERT: 'snapshot-revert',
  SNAPSHOT_DELETE: 'snapshot-delete',

  // SCHEDULING ACTION
  SCHED_ACTION_CREATE: 'sched-add',
  SCHED_ACTION_UPDATE: 'sched-update',
  SCHED_ACTION_DELETE: 'sched-delete',
  CHARTER_CREATE: 'charter_create',
  PERFORM_ACTION: 'perform_action',

  // CONFIGURATION
  UPDATE_CONF: 'update_configuration',
}

export const DEFAULT_VM_ACTIONS_BY_STATE = {
  [VM_ACTIONS.DEPLOY]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.UNDEPLOYED,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.HOLD]: [STATES.PENDING],
  [VM_ACTIONS.RECOVER]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.BOOT_FAILURE,
    STATES.BOOT_MIGRATE_FAILURE,
    STATES.BOOT_STOPPED_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.CLONING_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_STOP_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.PROLOG_MIGRATE_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
    STATES.PROLOG_RESUME_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.UPDATE_FAILURE,
  ],
  [VM_ACTIONS.RESTORE]: [STATES.POWEROFF],
  [VM_ACTIONS.TERMINATE_HARD]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.RUNNING,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.LOCK]: [],
  [VM_ACTIONS.UNLOCK]: [],
  // INFORMATION
  [VM_ACTIONS.RENAME]: [],
  [VM_ACTIONS.CHANGE_MODE]: [],
  [VM_ACTIONS.CHANGE_OWNER]: [],
  [VM_ACTIONS.CHANGE_GROUP]: [],
  // SCHEDULING ACTION
  [VM_ACTIONS.SCHED_ACTION_CREATE]: [],
  [VM_ACTIONS.SCHED_ACTION_UPDATE]: [],
  [VM_ACTIONS.SCHED_ACTION_DELETE]: [],
  [VM_ACTIONS.CHARTER_CREATE]: [],
  [VM_ACTIONS.RELEASE]: [STATES.HOLD],
  // CAPACITY
  [VM_ACTIONS.RESIZE_CAPACITY]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
  ],
  [VM_ACTIONS.SNAPSHOT_DISK_RENAME]: [],
  // CONFIGURATION
  [VM_ACTIONS.UPDATE_CONF]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.PROLOG,
    STATES.EPILOG,
    STATES.SHUTDOWN,
    STATES.CLEANUP_RESUBMIT,
    STATES.SHUTDOWN_POWEROFF,
    STATES.CLEANUP_DELETE,
    STATES.HOTPLUG_SAVEAS_POWEROFF,
    STATES.SHUTDOWN_UNDEPLOY,
    STATES.EPILOG_UNDEPLOY,
    STATES.PROLOG_UNDEPLOY,
    STATES.HOTPLUG_PROLOG_POWEROFF,
    STATES.HOTPLUG_EPILOG_POWEROFF,
    STATES.BOOT_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.DISK_SNAPSHOT_POWEROFF,
    STATES.DISK_SNAPSHOT_REVERT_POWEROFF,
    STATES.DISK_SNAPSHOT_DELETE_POWEROFF,
  ],
}

/** @enum {string} DUMMY Virtual machine actions by state */
export const DUMMY_VM_ACTIONS_BY_STATE = {
  [VM_ACTIONS.BACKUP]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DEPLOY]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.UNDEPLOYED,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.CREATE_APP_DIALOG]: [STATES.POWEROFF],
  [VM_ACTIONS.HOLD]: [STATES.PENDING],
  [VM_ACTIONS.LOCK]: [],
  [VM_ACTIONS.MIGRATE_LIVE]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE_POFF_HARD]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE_POFF]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.POWEROFF_HARD]: [STATES.RUNNING, STATES.SHUTDOWN, STATES.UNKNOWN],
  [VM_ACTIONS.POWEROFF]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.REBOOT_HARD]: [STATES.RUNNING],
  [VM_ACTIONS.REBOOT]: [STATES.RUNNING],
  [VM_ACTIONS.RECOVER]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.BOOT_FAILURE,
    STATES.BOOT_MIGRATE_FAILURE,
    STATES.BOOT_STOPPED_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.CLONING_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_STOP_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.PROLOG_MIGRATE_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
    STATES.PROLOG_RESUME_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.UPDATE_FAILURE,
  ],
  [VM_ACTIONS.RESTORE]: [STATES.POWEROFF],
  [VM_ACTIONS.RELEASE]: [STATES.HOLD],
  [VM_ACTIONS.RESCHED]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.RESUME]: [
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.SAVE_AS_TEMPLATE]: [STATES.POWEROFF],
  [VM_ACTIONS.STOP]: [STATES.SUSPENDED, STATES.RUNNING],
  [VM_ACTIONS.SUSPEND]: [STATES.RUNNING],
  [VM_ACTIONS.TERMINATE_HARD]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.RUNNING,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.TERMINATE]: [
    STATES.RUNNING,
    STATES.FAILURE,
    STATES.BOOT_FAILURE,
    STATES.BOOT_MIGRATE_FAILURE,
    STATES.PROLOG_MIGRATE_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_STOP_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.BOOT_STOPPED_FAILURE,
    STATES.PROLOG_RESUME_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
  ],
  [VM_ACTIONS.UNDEPLOY_HARD]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.UNDEPLOY]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.UNLOCK]: [],
  [VM_ACTIONS.UNRESCHED]: [STATES.RUNNING, STATES.UNKNOWN],

  // REMOTE
  [VM_ACTIONS.VMRC]: [STATES.RUNNING],
  [VM_ACTIONS.VNC]: [
    STATES.RUNNING,
    STATES.MIGRATE,
    STATES.SHUTDOWN,
    STATES.CANCEL,
    STATES.UNKNOWN,
    STATES.HOTPLUG,
    STATES.SHUTDOWN_POWEROFF,
    STATES.HOTPLUG_SNAPSHOT,
    STATES.HOTPLUG_NIC,
    STATES.HOTPLUG_SAVEAS,
    STATES.HOTPLUG_SAVEAS_POWEROFF,
    STATES.HOTPLUG_SAVEAS_SUSPENDED,
    STATES.SHUTDOWN_UNDEPLOY,
    STATES.DISK_SNAPSHOT,
    STATES.DISK_SNAPSHOT_REVERT,
    STATES.DISK_RESIZE,
    STATES.BACKUP,
  ],
  [VM_ACTIONS.SSH]: [STATES.RUNNING],
  [VM_ACTIONS.RDP]: [STATES.RUNNING],
  [VM_ACTIONS.FILE_RDP]: [STATES.RUNNING],
  [VM_ACTIONS.FILE_VIRT_VIEWER]: [STATES.RUNNING],

  // INFORMATION
  [VM_ACTIONS.RENAME]: [],
  [VM_ACTIONS.CHANGE_MODE]: [],
  [VM_ACTIONS.CHANGE_OWNER]: [],
  [VM_ACTIONS.CHANGE_GROUP]: [],

  // CAPACITY
  [VM_ACTIONS.RESIZE_CAPACITY]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
  ],

  // STORAGE
  [VM_ACTIONS.ATTACH_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_DISK_CREATE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.SNAPSHOT_DISK_RENAME]: [],
  [VM_ACTIONS.SNAPSHOT_DISK_REVERT]: [STATES.SUSPENDED, STATES.POWEROFF],
  [VM_ACTIONS.SNAPSHOT_DISK_DELETE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.RESIZE_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DISK_SAVEAS]: [STATES.SUSPENDED, STATES.POWEROFF, STATES.RUNNING],

  // NETWORK
  [VM_ACTIONS.ATTACH_NIC]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_NIC]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.UPDATE_NIC]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.ATTACH_SEC_GROUP]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_SEC_GROUP]: [STATES.POWEROFF, STATES.RUNNING],

  // PCI
  [VM_ACTIONS.ATTACH_PCI]: [STATES.POWEROFF],
  [VM_ACTIONS.DETACH_PCI]: [STATES.POWEROFF],

  // SNAPSHOT
  [VM_ACTIONS.SNAPSHOT_CREATE]: [STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_REVERT]: [STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_DELETE]: [STATES.POWEROFF, STATES.RUNNING],

  // SCHEDULING ACTION
  [VM_ACTIONS.SCHED_ACTION_CREATE]: [],
  [VM_ACTIONS.SCHED_ACTION_UPDATE]: [],
  [VM_ACTIONS.SCHED_ACTION_DELETE]: [],
  [VM_ACTIONS.CHARTER_CREATE]: [],

  // CONFIGURATION
  [VM_ACTIONS.UPDATE_CONF]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.PROLOG,
    STATES.EPILOG,
    STATES.SHUTDOWN,
    STATES.CLEANUP_RESUBMIT,
    STATES.SHUTDOWN_POWEROFF,
    STATES.CLEANUP_DELETE,
    STATES.HOTPLUG_SAVEAS_POWEROFF,
    STATES.SHUTDOWN_UNDEPLOY,
    STATES.EPILOG_UNDEPLOY,
    STATES.PROLOG_UNDEPLOY,
    STATES.HOTPLUG_PROLOG_POWEROFF,
    STATES.HOTPLUG_EPILOG_POWEROFF,
    STATES.BOOT_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.DISK_SNAPSHOT_POWEROFF,
    STATES.DISK_SNAPSHOT_REVERT_POWEROFF,
    STATES.DISK_SNAPSHOT_DELETE_POWEROFF,
  ],
}

/** @enum {string} KVM Virtual machine actions by state */
export const KVM_VM_ACTIONS_BY_STATE = {
  [VM_ACTIONS.BACKUP]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DEPLOY]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.UNDEPLOYED,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.CREATE_APP_DIALOG]: [STATES.POWEROFF],
  [VM_ACTIONS.HOLD]: [STATES.PENDING],
  [VM_ACTIONS.LOCK]: [],
  [VM_ACTIONS.MIGRATE_LIVE]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE_POFF_HARD]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE_POFF]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.POWEROFF_HARD]: [STATES.RUNNING, STATES.SHUTDOWN, STATES.UNKNOWN],
  [VM_ACTIONS.POWEROFF]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.REBOOT_HARD]: [STATES.RUNNING],
  [VM_ACTIONS.REBOOT]: [STATES.RUNNING],
  [VM_ACTIONS.RECOVER]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.BOOT_FAILURE,
    STATES.BOOT_MIGRATE_FAILURE,
    STATES.BOOT_STOPPED_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.CLONING_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_STOP_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.PROLOG_MIGRATE_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
    STATES.PROLOG_RESUME_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.UPDATE_FAILURE,
  ],
  [VM_ACTIONS.RESTORE]: [STATES.POWEROFF],
  [VM_ACTIONS.RELEASE]: [STATES.HOLD],
  [VM_ACTIONS.RESCHED]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.RESUME]: [
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.SAVE_AS_TEMPLATE]: [STATES.POWEROFF],
  [VM_ACTIONS.STOP]: [STATES.SUSPENDED, STATES.RUNNING],
  [VM_ACTIONS.SUSPEND]: [STATES.RUNNING],
  [VM_ACTIONS.TERMINATE_HARD]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.RUNNING,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.TERMINATE]: [
    STATES.RUNNING,
    STATES.FAILURE,
    STATES.BOOT_FAILURE,
    STATES.BOOT_MIGRATE_FAILURE,
    STATES.PROLOG_MIGRATE_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_STOP_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.BOOT_STOPPED_FAILURE,
    STATES.PROLOG_RESUME_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
  ],
  [VM_ACTIONS.UNDEPLOY_HARD]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.UNDEPLOY]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.UNLOCK]: [],
  [VM_ACTIONS.UNRESCHED]: [STATES.RUNNING, STATES.UNKNOWN],

  // REMOTE
  [VM_ACTIONS.VMRC]: [STATES.RUNNING],
  [VM_ACTIONS.VNC]: [
    STATES.RUNNING,
    STATES.MIGRATE,
    STATES.SHUTDOWN,
    STATES.CANCEL,
    STATES.UNKNOWN,
    STATES.HOTPLUG,
    STATES.SHUTDOWN_POWEROFF,
    STATES.HOTPLUG_SNAPSHOT,
    STATES.HOTPLUG_NIC,
    STATES.HOTPLUG_SAVEAS,
    STATES.HOTPLUG_SAVEAS_POWEROFF,
    STATES.HOTPLUG_SAVEAS_SUSPENDED,
    STATES.SHUTDOWN_UNDEPLOY,
    STATES.DISK_SNAPSHOT,
    STATES.DISK_SNAPSHOT_REVERT,
    STATES.DISK_RESIZE,
    STATES.BACKUP,
  ],
  [VM_ACTIONS.SSH]: [STATES.RUNNING],
  [VM_ACTIONS.RDP]: [STATES.RUNNING],
  [VM_ACTIONS.FILE_RDP]: [STATES.RUNNING],
  [VM_ACTIONS.FILE_VIRT_VIEWER]: [STATES.RUNNING],

  // INFORMATION
  [VM_ACTIONS.RENAME]: [],
  [VM_ACTIONS.CHANGE_MODE]: [],
  [VM_ACTIONS.CHANGE_OWNER]: [],
  [VM_ACTIONS.CHANGE_GROUP]: [],

  // CAPACITY
  [VM_ACTIONS.RESIZE_CAPACITY]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
  ],

  // STORAGE
  [VM_ACTIONS.ATTACH_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_DISK_CREATE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.SNAPSHOT_DISK_RENAME]: [],
  [VM_ACTIONS.SNAPSHOT_DISK_REVERT]: [STATES.SUSPENDED, STATES.POWEROFF],
  [VM_ACTIONS.SNAPSHOT_DISK_DELETE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.RESIZE_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DISK_SAVEAS]: [STATES.SUSPENDED, STATES.POWEROFF, STATES.RUNNING],

  // NETWORK
  [VM_ACTIONS.ATTACH_NIC]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_NIC]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.UPDATE_NIC]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.ATTACH_SEC_GROUP]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_SEC_GROUP]: [STATES.POWEROFF, STATES.RUNNING],

  // PCI
  [VM_ACTIONS.ATTACH_PCI]: [STATES.POWEROFF],
  [VM_ACTIONS.DETACH_PCI]: [STATES.POWEROFF],

  // SNAPSHOT
  [VM_ACTIONS.SNAPSHOT_CREATE]: [STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_REVERT]: [STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_DELETE]: [STATES.POWEROFF, STATES.RUNNING],

  // SCHEDULING ACTION
  [VM_ACTIONS.SCHED_ACTION_CREATE]: [],
  [VM_ACTIONS.SCHED_ACTION_UPDATE]: [],
  [VM_ACTIONS.SCHED_ACTION_DELETE]: [],
  [VM_ACTIONS.CHARTER_CREATE]: [],

  // CONFIGURATION
  [VM_ACTIONS.UPDATE_CONF]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.PROLOG,
    STATES.EPILOG,
    STATES.SHUTDOWN,
    STATES.CLEANUP_RESUBMIT,
    STATES.SHUTDOWN_POWEROFF,
    STATES.CLEANUP_DELETE,
    STATES.HOTPLUG_SAVEAS_POWEROFF,
    STATES.SHUTDOWN_UNDEPLOY,
    STATES.EPILOG_UNDEPLOY,
    STATES.PROLOG_UNDEPLOY,
    STATES.HOTPLUG_PROLOG_POWEROFF,
    STATES.HOTPLUG_EPILOG_POWEROFF,
    STATES.BOOT_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.DISK_SNAPSHOT_POWEROFF,
    STATES.DISK_SNAPSHOT_REVERT_POWEROFF,
    STATES.DISK_SNAPSHOT_DELETE_POWEROFF,
  ],
}

/** @enum {string} LXC Virtual machine actions by state */
export const LXC_VM_ACTIONS_BY_STATE = {
  [VM_ACTIONS.BACKUP]: [STATES.POWEROFF],
  [VM_ACTIONS.DEPLOY]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.UNDEPLOYED,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.CREATE_APP_DIALOG]: [STATES.POWEROFF],
  [VM_ACTIONS.HOLD]: [STATES.PENDING],
  [VM_ACTIONS.LOCK]: [],
  [VM_ACTIONS.MIGRATE_LIVE]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE_POFF_HARD]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE_POFF]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.MIGRATE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.POWEROFF_HARD]: [STATES.RUNNING, STATES.SHUTDOWN, STATES.UNKNOWN],
  [VM_ACTIONS.POWEROFF]: [STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.REBOOT_HARD]: [STATES.RUNNING],
  [VM_ACTIONS.REBOOT]: [STATES.RUNNING],
  [VM_ACTIONS.RECOVER]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.BOOT_FAILURE,
    STATES.BOOT_MIGRATE_FAILURE,
    STATES.BOOT_STOPPED_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.CLONING_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_STOP_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.PROLOG_MIGRATE_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
    STATES.PROLOG_RESUME_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.UPDATE_FAILURE,
  ],
  [VM_ACTIONS.RESTORE]: [STATES.POWEROFF],
  [VM_ACTIONS.RELEASE]: [STATES.HOLD],
  [VM_ACTIONS.RESCHED]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.RESUME]: [
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.SAVE_AS_TEMPLATE]: [STATES.POWEROFF],
  [VM_ACTIONS.STOP]: [STATES.SUSPENDED, STATES.RUNNING],
  [VM_ACTIONS.SUSPEND]: [STATES.RUNNING],
  [VM_ACTIONS.TERMINATE_HARD]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.STOPPED,
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.RUNNING,
    STATES.UNKNOWN,
  ],
  [VM_ACTIONS.TERMINATE]: [
    STATES.RUNNING,
    STATES.FAILURE,
    STATES.BOOT_FAILURE,
    STATES.BOOT_MIGRATE_FAILURE,
    STATES.PROLOG_MIGRATE_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_STOP_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.PROLOG_MIGRATE_SUSPEND_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.BOOT_STOPPED_FAILURE,
    STATES.PROLOG_RESUME_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE,
  ],
  [VM_ACTIONS.UNDEPLOY_HARD]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.UNDEPLOY]: [STATES.POWEROFF, STATES.RUNNING, STATES.UNKNOWN],
  [VM_ACTIONS.UNLOCK]: [],
  [VM_ACTIONS.UNRESCHED]: [STATES.RUNNING, STATES.UNKNOWN],

  // REMOTE
  [VM_ACTIONS.VMRC]: [STATES.RUNNING],
  [VM_ACTIONS.VNC]: [
    STATES.RUNNING,
    STATES.MIGRATE,
    STATES.SHUTDOWN,
    STATES.CANCEL,
    STATES.UNKNOWN,
    STATES.HOTPLUG,
    STATES.SHUTDOWN_POWEROFF,
    STATES.HOTPLUG_SNAPSHOT,
    STATES.HOTPLUG_NIC,
    STATES.HOTPLUG_SAVEAS,
    STATES.HOTPLUG_SAVEAS_POWEROFF,
    STATES.HOTPLUG_SAVEAS_SUSPENDED,
    STATES.SHUTDOWN_UNDEPLOY,
    STATES.DISK_SNAPSHOT,
    STATES.DISK_SNAPSHOT_REVERT,
    STATES.DISK_RESIZE,
    STATES.BACKUP,
  ],
  [VM_ACTIONS.SSH]: [STATES.RUNNING],
  [VM_ACTIONS.RDP]: [STATES.RUNNING],
  [VM_ACTIONS.FILE_RDP]: [STATES.RUNNING],
  [VM_ACTIONS.FILE_VIRT_VIEWER]: [STATES.RUNNING],

  // INFORMATION
  [VM_ACTIONS.RENAME]: [],
  [VM_ACTIONS.CHANGE_MODE]: [],
  [VM_ACTIONS.CHANGE_OWNER]: [],
  [VM_ACTIONS.CHANGE_GROUP]: [],

  // CAPACITY
  [VM_ACTIONS.RESIZE_CAPACITY]: [
    STATES.INIT,
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
  ],

  // STORAGE
  [VM_ACTIONS.ATTACH_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_DISK_CREATE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.SNAPSHOT_DISK_RENAME]: [],
  [VM_ACTIONS.SNAPSHOT_DISK_REVERT]: [STATES.SUSPENDED, STATES.POWEROFF],
  [VM_ACTIONS.SNAPSHOT_DISK_DELETE]: [
    STATES.SUSPENDED,
    STATES.POWEROFF,
    STATES.RUNNING,
  ],
  [VM_ACTIONS.RESIZE_DISK]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DISK_SAVEAS]: [STATES.SUSPENDED, STATES.POWEROFF, STATES.RUNNING],

  // NETWORK
  [VM_ACTIONS.ATTACH_NIC]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_NIC]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.ATTACH_SEC_GROUP]: [STATES.POWEROFF, STATES.RUNNING],
  [VM_ACTIONS.DETACH_SEC_GROUP]: [STATES.POWEROFF, STATES.RUNNING],

  // SNAPSHOT
  [VM_ACTIONS.SNAPSHOT_CREATE]: [STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_REVERT]: [STATES.RUNNING],
  [VM_ACTIONS.SNAPSHOT_DELETE]: [STATES.POWEROFF, STATES.RUNNING],

  // SCHEDULING ACTION
  [VM_ACTIONS.SCHED_ACTION_CREATE]: [],
  [VM_ACTIONS.SCHED_ACTION_UPDATE]: [],
  [VM_ACTIONS.SCHED_ACTION_DELETE]: [],
  [VM_ACTIONS.CHARTER_CREATE]: [],

  // CONFIGURATION
  [VM_ACTIONS.UPDATE_CONF]: [
    STATES.PENDING,
    STATES.HOLD,
    STATES.ACTIVE,
    STATES.POWEROFF,
    STATES.UNDEPLOYED,
    STATES.CLONING,
    STATES.CLONING_FAILURE,
    STATES.PROLOG,
    STATES.EPILOG,
    STATES.SHUTDOWN,
    STATES.CLEANUP_RESUBMIT,
    STATES.SHUTDOWN_POWEROFF,
    STATES.CLEANUP_DELETE,
    STATES.HOTPLUG_SAVEAS_POWEROFF,
    STATES.SHUTDOWN_UNDEPLOY,
    STATES.EPILOG_UNDEPLOY,
    STATES.PROLOG_UNDEPLOY,
    STATES.HOTPLUG_PROLOG_POWEROFF,
    STATES.HOTPLUG_EPILOG_POWEROFF,
    STATES.BOOT_FAILURE,
    STATES.PROLOG_FAILURE,
    STATES.EPILOG_FAILURE,
    STATES.EPILOG_UNDEPLOY_FAILURE,
    STATES.PROLOG_MIGRATE_POWEROFF,
    STATES.PROLOG_MIGRATE_POWEROFF_FAILURE,
    STATES.BOOT_UNDEPLOY_FAILURE,
    STATES.PROLOG_UNDEPLOY_FAILURE,
    STATES.DISK_SNAPSHOT_POWEROFF,
    STATES.DISK_SNAPSHOT_REVERT_POWEROFF,
    STATES.DISK_SNAPSHOT_DELETE_POWEROFF,
  ],
}

/** @enum {string} Hypervisors */
export const HYPERVISORS = {
  kvm: 'kvm',
  lxc: 'lxc',
  dummy: 'dummy',
  qemu: 'qemu',
}

/** @enum {string} Virtual machine actions by state */
export const VM_ACTIONS_BY_STATE = {
  undefined: DEFAULT_VM_ACTIONS_BY_STATE,
  [HYPERVISORS.dummy]: DUMMY_VM_ACTIONS_BY_STATE,
  [HYPERVISORS.kvm]: KVM_VM_ACTIONS_BY_STATE,
  [HYPERVISORS.lxc]: LXC_VM_ACTIONS_BY_STATE,
  [HYPERVISORS.qemu]: KVM_VM_ACTIONS_BY_STATE,
}

/** @type {object} Actions that can be scheduled */
export const VM_ACTIONS_WITH_SCHEDULE = {
  [VM_ACTIONS.BACKUP]: T.Backup,
  [VM_ACTIONS.TERMINATE]: T.Terminate,
  [VM_ACTIONS.TERMINATE_HARD]: T.TerminateHard,
  [VM_ACTIONS.UNDEPLOY]: T.Undeploy,
  [VM_ACTIONS.UNDEPLOY_HARD]: T.UndeployHard,
  [VM_ACTIONS.HOLD]: T.Hold,
  [VM_ACTIONS.RELEASE]: T.Release,
  [VM_ACTIONS.STOP]: T.Stop,
  [VM_ACTIONS.SUSPEND]: T.Suspend,
  [VM_ACTIONS.RESUME]: T.Resume,
  [VM_ACTIONS.REBOOT]: T.Reboot,
  [VM_ACTIONS.REBOOT_HARD]: T.RebootHard,
  [VM_ACTIONS.POWEROFF]: T.Poweroff,
  [VM_ACTIONS.POWEROFF_HARD]: T.PoweroffHard,
  [VM_ACTIONS.SNAPSHOT_CREATE]: T.SnapshotCreate,
  [VM_ACTIONS.SNAPSHOT_REVERT]: T.SnapshotRevert,
  [VM_ACTIONS.SNAPSHOT_DELETE]: T.SnapshotDelete,
}

/** @type {object} Actions that can be scheduled */
export const VM_ACTIONS_WITH_SCHEDULE_INTANTIATED = {
  [VM_ACTIONS.SNAPSHOT_DISK_CREATE]: T.DiskSnapshotCreate,
  [VM_ACTIONS.SNAPSHOT_DISK_REVERT]: T.DiskSnapshotRevert,
  [VM_ACTIONS.SNAPSHOT_DISK_DELETE]: T.DiskSnapshotDelete,
}

/** @type {string[]} Actions that can be used in charter */
export const VM_ACTIONS_IN_CHARTER = [
  VM_ACTIONS.TERMINATE,
  VM_ACTIONS.TERMINATE_HARD,
  VM_ACTIONS.UNDEPLOY,
  VM_ACTIONS.UNDEPLOY_HARD,
  VM_ACTIONS.HOLD,
  VM_ACTIONS.RELEASE,
  VM_ACTIONS.STOP,
  VM_ACTIONS.SUSPEND,
  VM_ACTIONS.RESUME,
  VM_ACTIONS.REBOOT,
  VM_ACTIONS.REBOOT_HARD,
  VM_ACTIONS.POWEROFF,
  VM_ACTIONS.POWEROFF_HARD,
]

/**
 * @enum {(
 * 'none' |
 * 'migrate' |
 * 'live-migrate' |
 * 'shutdown' |
 * 'shutdown-hard' |
 * 'undeploy' |
 * 'undeploy-hard' |
 * 'hold' |
 * 'release' |
 * 'stop' |
 * 'suspend' |
 * 'resume' |
 * 'boot' |
 * 'delete' |
 * 'delete-recreate' |
 * 'reboot' |
 * 'reboot-hard' |
 * 'resched' |
 * 'unresched' |
 * 'poweroff' |
 * 'poweroff-hard' |
 * 'disk-attach' |
 * 'disk-detach' |
 * 'nic-attach' |
 * 'nic-detach' |
 * 'disk-snapshot-create' |
 * 'disk-snapshot-delete' |
 * 'terminate' |
 * 'terminate-hard' |
 * 'disk-resize' |
 * 'deploy' |
 * 'chown' |
 * 'chmod' |
 * 'updateconf' |
 * 'rename' |
 * 'resize' |
 * 'update' |
 * 'snapshot-resize' |
 * 'snapshot-delete' |
 * 'snapshot-revert' |
 * 'disk-saveas' |
 * 'disk-snapshot-revert' |
 * 'recover' |
 * 'retry' |
 * 'monitor' |
 * 'disk-snapshot-rename' |
 * 'alias-attach' |
 * 'alias-detach' |
 * 'poweroff-migrate' |
 * 'poweroff-hard-migrate' |
 * 'backup'
 * )} History actions
 */
export const HISTORY_ACTIONS = [
  'none',
  'migrate',
  'live-migrate',
  'shutdown',
  'shutdown-hard',
  'undeploy',
  'undeploy-hard',
  'hold',
  'release',
  'stop',
  'suspend',
  'resume',
  'boot',
  'delete',
  'delete-recreate',
  'reboot',
  'reboot-hard',
  'resched',
  'unresched',
  'poweroff',
  'poweroff-hard',
  'disk-attach',
  'disk-detach',
  'nic-attach',
  'nic-detach',
  'disk-snapshot-create',
  'disk-snapshot-delete',
  'terminate',
  'terminate-hard',
  'disk-resize',
  'deploy',
  'chown',
  'chmod',
  'updateconf',
  'rename',
  'resize',
  'update',
  'snapshot-resize',
  'snapshot-delete',
  'snapshot-revert',
  'disk-saveas',
  'disk-snapshot-revert',
  'recover',
  'retry',
  'monitor',
  'disk-snapshot-rename',
  'alias-attach',
  'alias-detach',
  'poweroff-migrate',
  'poweroff-hard-migrate',
  'backup',
]

/**
 * @type {(string|string[])[]} Possible attribute names for nic alias ip
 */
export const NIC_IP_ATTRS = [
  'EXTERNAL_IP', // external IP must be first
  'IP',
  'IP6',
  'IP6_GLOBAL',
  'IP6_ULA',
  'MAC',
]

/**
 * @type {string[]} Possible attribute names for external ip
 */
export const EXTERNAL_IP_ATTRS = [
  'GUEST_IP',
  'GUEST_IP_ADDRESSES',

  // unsupported by OpenNebula
  'AWS_IP_ADDRESS',
  'AWS_PUBLIC_IP_ADDRESS',
  'AWS_PRIVATE_IP_ADDRESS',
  'AZ_IPADDRESS',
  'SL_PRIMARYIPADDRESS',
]

/** @enum {string[]} Supported configuration attributes in the VM */
export const ATTR_CONF_CAN_BE_UPDATED = {
  OS: [
    'ARCH',
    'MACHINE',
    'KERNEL',
    'INITRD',
    'BOOTLOADER',
    'BOOT',
    'SD_DISK_BUS',
    'UUID',
  ],
  FEATURES: ['ACPI', 'PAE', 'APIC', 'LOCALTIME', 'HYPERV', 'GUEST_AGENT'],
  INPUT: ['TYPE', 'BUS'],
  GRAPHICS: ['TYPE', 'LISTEN', 'PASSWD', 'KEYMAP'],
  RAW: ['DATA', 'DATA_VMX', 'TYPE'],
  CONTEXT: '*',
  BACKUP_CONFIG: '*',
}
