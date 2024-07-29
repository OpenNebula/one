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
import * as ACTIONS from 'client/constants/actions'
import COLOR from 'client/constants/color'
import * as STATES from 'client/constants/states'
// eslint-disable-next-line no-unused-vars
import { DISK_TYPES_STR } from 'client/constants/image'
// eslint-disable-next-line no-unused-vars
import { Permissions } from 'client/constants/common'
import { T } from 'client/constants'

/**
 * @typedef Datastore
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} UID - User id
 * @property {string} UNAME - User name
 * @property {string|number} GID - Group id
 * @property {string} GNAME - Group name
 * @property {0|1} STATE - Possible STATE values are 0 (READY) and 1 (DISABLE)
 * @property {Permissions} [PERMISSIONS] - Permissions
 * @property {string} DS_MAD - Datastore driver name
 * @property {string} TM_MAD - Transfer driver name
 * @property {string} BASE_PATH - Datastore directory
 * @property {string} TYPE - Type
 * @property {DISK_TYPES_STR} DISK_TYPE - Disk type
 * @property {{ ID: string[] }} CLUSTERS - Clusters
 * @property {{ ID: string[] }} IMAGES - Images
 * @property {string|number} TOTAL_MB - Total capacity
 * @property {string|number} FREE_MB - Free capacity
 * @property {string|number} USED_MB - Used capacity
 * @property {object} TEMPLATE - Template
 * @property {string} [TEMPLATE.RESTRICTED_DIRS] - Paths that cannot be used to register images. A space separated list of paths.
 * @property {string} [TEMPLATE.SAFE_DIRS] - If you need to allow a directory listed under RESTRICTED_DIRS. A space separated list of paths.
 * @property {string} [TEMPLATE.ALLOW_ORPHANS] - Safe directories
 */

/** @type {STATES.StateInfo[]} Datastore states */
export const DATASTORE_STATES = [
  {
    name: STATES.READY,
    shortName: 'on',
    color: COLOR.success.main,
  },
  {
    name: STATES.DISABLED,
    shortName: 'off',
    color: COLOR.error.dark,
  },
]

/** @enum {string} Datastore actions */
export const DATASTORE_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  DELETE: 'delete',
  EDIT_LABELS: 'edit_labels',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
  CHANGE_CLUSTER: 'change_cluster',
  ENABLE: 'enable',
  DISABLE: 'disable',
}

/**
 * @enum {{ high: number, low: number }}
 * Datastore threshold to specify the maximum and minimum of the bar range
 */
export const DS_THRESHOLD = {
  CAPACITY: { high: 66, low: 33 },
}

export const DATASTORE_OPTIONS = {
  FILESYSTEM: { name: T.Filesystem, value: 'fs' },
  CEPH: { name: T.Ceph, value: 'ceph' },
  DEVICES: { name: T.Devices, value: 'dev' },
  RESTIC: { name: T.StorageRestic, value: 'restic' },
  RSYNC: { name: T.StorageRsync, value: 'rsync' },
  CUSTOM: { name: T.Custom, value: 'custom' },
}

export const TRANSFER_OPTIONS = {
  SHARED: { name: T.Shared, value: 'shared' },
  SSH: { name: T.SSH, value: 'ssh' },
  FS_LVM: { name: T.FSLVM, value: 'fs_lvm' },
  CEPH: { name: T.Ceph, value: 'ceph' },
  DEVICES: { name: T.Devices, value: 'dev' },
  CUSTOM: { name: T.Custom, value: 'custom' },
}

export const DS_STORAGE_BACKENDS = {
  FS_SHARED: { name: T.FilesystemShared, value: 'fs-shared' },
  FS_SSH: { name: T.FilesystemSSH, value: 'fs-ssh' },
  CEPH: { name: T.Ceph, value: 'ceph-ceph' },
  FS_LVM: { name: T.LVM, value: 'fs-fs_lvm' },
  RAW: { name: T.RawDeviceMapping, value: 'dev-dev' },
  RESTIC: { name: T.StorageRestic, value: 'restic' },
  RSYNC: { name: T.StorageRsync, value: 'rsync' },
  CUSTOM: { name: T.Custom, value: 'custom' },
}

export const DS_DISK_TYPES = {
  RBD: 'RBD',
  FILE: 'FILE',
  BLOCK: 'BLOCK',
  GLUSTER: 'GLUSTER',
}

export const DISK_TYPES_BY_STORAGE_BACKEND = {
  [DS_STORAGE_BACKENDS.FS_SHARED.value]: DS_DISK_TYPES.FILE,
  [DS_STORAGE_BACKENDS.FS_SSH.value]: DS_DISK_TYPES.FILE,
  [DS_STORAGE_BACKENDS.CEPH.value]: DS_DISK_TYPES.RBD,
  [DS_STORAGE_BACKENDS.FS_LVM.value]: DS_DISK_TYPES.FILE,
  [DS_STORAGE_BACKENDS.RAW.value]: DS_DISK_TYPES.FILE,
  [DS_STORAGE_BACKENDS.RESTIC.value]: DS_DISK_TYPES.FILE,
  [DS_STORAGE_BACKENDS.RSYNC.value]: DS_DISK_TYPES.FILE,
}

export const DATASTORE_TYPES = {
  IMAGE: {
    id: 0,
    name: T.Image,
    value: 'IMAGE_DS',
    storageBackends: [
      DS_STORAGE_BACKENDS.FS_SHARED,
      DS_STORAGE_BACKENDS.FS_SSH,
      DS_STORAGE_BACKENDS.CEPH,
      DS_STORAGE_BACKENDS.FS_LVM,
      DS_STORAGE_BACKENDS.RAW,
      DS_STORAGE_BACKENDS.CUSTOM,
    ],
  },
  SYSTEM: {
    id: 1,
    name: T.System,
    value: 'SYSTEM_DS',
    storageBackends: [
      DS_STORAGE_BACKENDS.FS_SHARED,
      DS_STORAGE_BACKENDS.FS_SSH,
      DS_STORAGE_BACKENDS.CEPH,
      DS_STORAGE_BACKENDS.FS_LVM,
      DS_STORAGE_BACKENDS.CUSTOM,
    ],
  },
  FILE: {
    id: 2,
    name: T.File,
    value: 'FILE_DS',
    storageBackends: [
      DS_STORAGE_BACKENDS.FS_SHARED,
      DS_STORAGE_BACKENDS.FS_SSH,
      DS_STORAGE_BACKENDS.CUSTOM,
    ],
  },
  BACKUP: {
    id: 3,
    name: T.Backup,
    value: 'BACKUP_DS',
    storageBackends: [
      DS_STORAGE_BACKENDS.RESTIC,
      DS_STORAGE_BACKENDS.RSYNC,
      DS_STORAGE_BACKENDS.CUSTOM,
    ],
  },
}

export const DS_VCENTER_ADAPTER_TYPE_OPTIONS = ['lsiLogic', 'ide', 'busLogic']
export const DS_VCENTER_DISK_TYPE_OPTIONS = [
  'delta',
  'eagerZeroedThick',
  'flatMonolithic',
  'preallocated',
  'raw',
  'rdm',
  'rdmp',
  'seSparse',
  'sparse2Gb',
  'sparseMonolithic',
  'thick',
  'thick2Gb',
  'thin',
]
