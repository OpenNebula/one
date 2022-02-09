/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import COLOR from 'client/constants/color'

/** @enum {string} Image type */
export const IMAGE_TYPES_STR = {
  OS: 'OS',
  CDROM: 'CDROM',
  DATABLOCK: 'DATABLOCK',
  KERNEL: 'KERNEL',
  RAMDISK: 'RAMDISK',
  CONTEXT: 'CONTEXT',
}

/** @type {IMAGE_TYPES_STR[]} Return the string representation of an Image type */
export const IMAGE_TYPES = [
  IMAGE_TYPES_STR.OS,
  IMAGE_TYPES_STR.CDROM,
  IMAGE_TYPES_STR.DATABLOCK,
  IMAGE_TYPES_STR.KERNEL,
  IMAGE_TYPES_STR.RAMDISK,
  IMAGE_TYPES_STR.CONTEXT,
]

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
