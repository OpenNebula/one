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
import {
  IMAGE_TYPES,
  DISK_TYPES,
  IMAGE_STATES,
  StateInfo,
} from 'client/constants'

/**
 * Returns the image type.
 *
 * @param {object} image - Image
 * @param {number|string} image.TYPE - Type numeric code
 * @returns {IMAGE_TYPES} - Image type
 */
export const getType = ({ TYPE } = {}) =>
  isNaN(+TYPE) ? TYPE : IMAGE_TYPES[+TYPE]

/**
 * Returns the image state.
 *
 * @param {object} image - Image
 * @param {number|string} image.STATE - State code
 * @returns {StateInfo} - Image state information
 */
export const getState = ({ STATE } = {}) => IMAGE_STATES[+STATE]

/**
 * Returns the disk type.
 *
 * @param {object} image - Image
 * @param {number|string} image.DISK_TYPE - Disk type numeric code
 * @returns {DISK_TYPES} - Disk type
 */
export const getDiskType = ({ DISK_TYPE } = {}) =>
  isNaN(+DISK_TYPE) ? DISK_TYPE : DISK_TYPES[+DISK_TYPE]
