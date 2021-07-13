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
import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

/**
 * @enum {(
 * 'OS'|
 * 'CD ROM'|
 * 'DATABLOCK'|
 * 'KERNEL'|
 * 'RAMDISK'|
 * 'CONTEXT'
 * )} Image type
 */
export const IMAGE_TYPES = [
  'OS',
  'CD ROM',
  'DATABLOCK',
  'KERNEL',
  'RAMDISK',
  'CONTEXT'
]

/** @enum {('FILE'|'CD ROM'|'BLOCK'|'RBD')} Disk type */
export const DISK_TYPES = [
  'FILE',
  'CD ROM',
  'BLOCK',
  'RBD'
]

/** @type {STATES.StateInfo[]} Image states */
export const IMAGE_STATES = [
  { // 0
    name: STATES.INIT,
    color: COLOR.debug.main
  },
  { // 1
    name: STATES.READY,
    color: COLOR.success.main
  },
  { // 2
    name: STATES.USED,
    color: COLOR.success.main
  },
  { // 3
    name: STATES.DISABLED,
    color: COLOR.debug.light
  },
  { // 4
    name: STATES.LOCKED,
    color: COLOR.warning.main
  },
  { // 5
    name: STATES.ERROR,
    color: COLOR.error.main
  },
  { // 6
    name: STATES.CLONE,
    color: COLOR.info.light
  },
  { // 7
    name: STATES.DELETE,
    color: COLOR.error.main
  },
  { // 8
    name: STATES.USED_PERS,
    color: COLOR.error.light
  },
  { // 9
    name: STATES.LOCKED_USED,
    color: COLOR.warning.light
  },
  { // 10
    name: STATES.LOCKED_USED_PERS,
    color: COLOR.error.light
  }
]
