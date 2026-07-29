/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { Tag } from '@ComponentsV2Module'
import { T, UNITS } from '@ConstantsModule'
import { getDiskName, getDiskType } from '@modules/models/Image/general'
import { prettyBytes, stringToBoolean } from '@UtilsModule'

/** Columns used by backup disk-selection tables. */
export const BACKUP_DISK_COLUMNS = [
  {
    header: T.ID,
    id: 'id',
    accessorKey: 'DISK_ID',
    grow: false,
  },
  {
    header: T.Name,
    id: 'name',
    accessorFn: (disk) => getDiskName(disk) ?? '-',
    truncate: true,
  },
  {
    header: T.DiskType,
    id: 'type',
    accessorFn: getDiskType,
    grow: false,
    cell: ({ row }) => {
      const diskType = getDiskType(row.original)

      return diskType ? <Tag title={diskType} status="default" /> : '-'
    },
  },
  {
    header: T.TargetDevice,
    id: 'target',
    accessorKey: 'TARGET',
  },
  {
    header: T.Size,
    id: 'size',
    accessorFn: (disk) => prettyBytes(disk?.SIZE ?? 0, UNITS.MB),
  },
  {
    header: T.Persistent,
    id: 'persistent',
    accessorFn: (disk) => (stringToBoolean(disk?.PERSISTENT) ? T.Yes : T.No),
  },
]

const UNSUPPORTED_BACKUP_DISK_TYPES = new Set([
  'SWAP',
  'CDROM',
  'RBD_CDROM',
  'FILESYSTEM',
])

const isBackupDiskSupported = (disk, includeVolatile) => {
  const type = String(disk?.TYPE ?? '').toUpperCase()

  return (
    !UNSUPPORTED_BACKUP_DISK_TYPES.has(type) &&
    (includeVolatile || type !== 'FS')
  )
}

/**
 * @param {object} vm - Virtual machine resource
 * @param {object} options - Disk filtering options
 * @param {boolean} options.includeVolatile - Include volatile filesystem disks
 * @returns {object[]} Attached disks supported by VM backups
 */
export const getBackupDiskRows = (vm = {}, { includeVolatile = true } = {}) =>
  []
    .concat(vm?.TEMPLATE?.DISK ?? [])
    .filter(Boolean)
    .filter((disk) => isBackupDiskSupported(disk, includeVolatile))
    .map((disk) => ({ ...disk, DISK_ID: String(disk?.DISK_ID) }))
