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
import * as STATES from 'client/constants/states'
import * as ACTIONS from 'client/constants/actions'
import COLOR from 'client/constants/color'
// eslint-disable-next-line no-unused-vars
import { Permissions, LockInfo } from 'client/constants/common'
// eslint-disable-next-line no-unused-vars
import { DiskSnapshots } from 'client/constants/vm'

/**
 * @typedef Image
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {string} UID - User id
 * @property {string} UNAME - User name
 * @property {string} GID - Group id
 * @property {string} GNAME - Group name
 * @property {string} STATE - State
 * @property {string} PREV_STATE - Previous state
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {LockInfo} [LOCK] - Lock information
 * @property {IMAGE_TYPES_STR} TYPE - Type
 * @property {DISK_TYPES_STR} DISK_TYPE - Disk type
 * @property {string} PERSISTENT - Persistent
 * @property {string} REGTIME - Registration time
 * @property {string} SOURCE - Source
 * @property {string} PATH - Path
 * @property {string} FORMAT - Format
 * @property {string} FS - Filesystem
 * @property {string} SIZE - Size
 * @property {string} RUNNING_VMS - Running VMs
 * @property {string} CLONING_OPS - Cloning OPs
 * @property {string} CLONING_ID - Cloning id
 * @property {string} TARGET_SNAPSHOT - Target snapshot
 * @property {string} DATASTORE_ID - Datastore id
 * @property {string} DATASTORE - Datastore
 * @property {{ ID: string|string[] }} VMS - VMs
 * @property {{ ID: string|string[] }} CLONES - Clones
 * @property {{ ID: string|string[] }} APP_CLONES - App clones
 * @property {object} TEMPLATE - Template
 * @property {DiskSnapshots} SNAPSHOTS - Snapshots information
 */

/** @enum {string} Image type */
export const IMAGE_TYPES_STR = {
  OS: 'OS',
  CDROM: 'CDROM',
  DATABLOCK: 'DATABLOCK',
  KERNEL: 'KERNEL',
  RAMDISK: 'RAMDISK',
  CONTEXT: 'CONTEXT',
  BACKUP: 'BACKUP',
}

/** @type {IMAGE_TYPES_STR[]} Return the string representation of an Image type */
export const IMAGE_TYPES = [
  IMAGE_TYPES_STR.OS,
  IMAGE_TYPES_STR.CDROM,
  IMAGE_TYPES_STR.DATABLOCK,
  IMAGE_TYPES_STR.KERNEL,
  IMAGE_TYPES_STR.RAMDISK,
  IMAGE_TYPES_STR.CONTEXT,
  IMAGE_TYPES_STR.BACKUP,
]

/** @type {IMAGE_TYPES_STR[]} Return the string representation of an Image type for tab files */
export const IMAGE_TYPES_FOR_FILES = [
  IMAGE_TYPES_STR.KERNEL,
  IMAGE_TYPES_STR.RAMDISK,
  IMAGE_TYPES_STR.CONTEXT,
]

/** @type {IMAGE_TYPES_STR[]} Return the string representation of an Image type for tab images */
export const IMAGE_TYPES_FOR_IMAGES = [
  IMAGE_TYPES_STR.OS,
  IMAGE_TYPES_STR.CDROM,
  IMAGE_TYPES_STR.DATABLOCK,
]

/** @type {IMAGE_TYPES_STR[]} Return the string representation of an Image type for tab files */
export const IMAGE_TYPES_FOR_BACKUPS = [IMAGE_TYPES_STR.BACKUP]

/** @enum {string} Disk type */
export const DISK_TYPES_STR = {
  FILE: 'FILE',
  CDROM: 'CDROM',
  BLOCK: 'BLOCK',
  RBD: 'RBD',
  RBD_CDROM: 'RBD CDROM',
  GLUSTER: 'GLUSTER',
  GLUSTER_CDROM: 'GLUSTER CDROM',
  SHEEPDOG: 'SHEEPDOG',
  SHEEPDOG_CDROM: 'SHEEPDOG CDROM',
  ISCSI: 'ISCII',
}
/** @enum {DISK_TYPES_STR[]} Return the string representation of a Disk type */
export const DISK_TYPES = [
  DISK_TYPES_STR.FILE,
  DISK_TYPES_STR.CDROM,
  DISK_TYPES_STR.BLOCK,
  DISK_TYPES_STR.RBD,
  DISK_TYPES_STR.RBD_CDROM,
  DISK_TYPES_STR.GLUSTER,
  DISK_TYPES_STR.GLUSTER_CDROM,
  DISK_TYPES_STR.SHEEPDOG,
  DISK_TYPES_STR.SHEEPDOG_CDROM,
  DISK_TYPES_STR.ISCSI,
]

/** @type {STATES.StateInfo[]} Image states */
export const IMAGE_STATES = [
  {
    // 0
    name: STATES.INIT,
    color: COLOR.debug.main,
  },
  {
    // 1
    name: STATES.READY,
    color: COLOR.success.main,
  },
  {
    // 2
    name: STATES.USED,
    color: COLOR.success.main,
  },
  {
    // 3
    name: STATES.DISABLED,
    color: COLOR.debug.light,
  },
  {
    // 4
    name: STATES.LOCKED,
    color: COLOR.warning.main,
  },
  {
    // 5
    name: STATES.ERROR,
    color: COLOR.error.main,
  },
  {
    // 6
    name: STATES.CLONE,
    color: COLOR.info.light,
  },
  {
    // 7
    name: STATES.DELETE,
    color: COLOR.error.main,
  },
  {
    // 8
    name: STATES.USED_PERS,
    color: COLOR.error.light,
  },
  {
    // 9
    name: STATES.LOCKED_USED,
    color: COLOR.warning.light,
  },
  {
    // 10
    name: STATES.LOCKED_USED_PERS,
    color: COLOR.error.light,
  },
]

/** @enum {string} Image actions */
export const IMAGE_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  DELETE: 'delete',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  CLONE: 'clone',
  ENABLE: 'enable',
  DISABLE: 'disable',
  PERSISTENT: 'persistent',
  NON_PERSISTENT: 'nonpersistent',
  RESTORE: 'restore',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
  CHANGE_TYPE: 'chtype',
  CHANGE_PERS: 'persistent',
  SNAPSHOT_FLATTEN: 'flatten',
  SNAPSHOT_REVERT: 'revert',
  SNAPSHOT_DELETE: 'delete',
}
