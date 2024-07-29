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
import {
  IMAGE_TYPES,
  DISK_TYPES,
  IMAGE_STATES,
  STATES,
  Image,
  DiskSnapshot,
} from 'client/constants'
import { prettyBytes } from 'client/utils'

/**
 * Returns the image type.
 *
 * @param {Image} image - Image
 * @returns {IMAGE_TYPES} - Image type
 */
export const getType = ({ TYPE } = {}) =>
  isNaN(+TYPE) ? TYPE : IMAGE_TYPES[+TYPE]

/**
 * Returns the image state.
 *
 * @param {Image} image - Image
 * @returns {STATES.StateInfo} - Image state information
 */
export const getState = ({ STATE } = {}) => IMAGE_STATES[+STATE]

/**
 * Returns the disk type.
 *
 * @param {Image} image - Image
 * @returns {DISK_TYPES} - Disk type
 */
export const getDiskType = ({ DISK_TYPE } = {}) =>
  isNaN(+DISK_TYPE) ? DISK_TYPE : DISK_TYPES[+DISK_TYPE]

/**
 * Returns the disk name.
 *
 * @param {Image} image - Image
 * @returns {string} - Disk name
 */
export const getDiskName = ({ IMAGE, SIZE, TYPE, FORMAT } = {}) => {
  const size = +SIZE ? prettyBytes(+SIZE, 'MB') : '-'
  const type = String(TYPE).toLowerCase()

  return IMAGE ?? { fs: `${FORMAT} - ${size}`, swap: size }[type]
}

/**
 * @param {Image} image - Image
 * @returns {DiskSnapshot[]} List of snapshots from resource
 */
export const getSnapshots = (image) => {
  const {
    SNAPSHOTS: { SNAPSHOT },
  } = image ?? {}

  return [SNAPSHOT].flat().filter(Boolean)
}
