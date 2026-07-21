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
import {
  DISK_TYPES,
  IMAGE_STATES,
  STATES,
  Image,
  DiskSnapshot,
} from '@ConstantsModule'
import {
  prettyBytes,
  getLocked,
  getImageType as getImageTypeFromUtils,
  getImageTypeLabel as getImageTypeLabelFromUtils,
} from '@UtilsModule'

/**
 * Returns the image state.
 *
 * @param {Image} image - Image
 * @returns {STATES.StateInfo} - Image state information
 */
export const getImageState = ({ STATE } = {}) => IMAGE_STATES[+STATE]

/**
 * Returns the image type.
 *
 * @param {Image} image - Image
 * @returns {string} - Image type
 */
export const getImageType = getImageTypeFromUtils

/**
 * Returns the display name of an image type.
 *
 * @param {Image} image - Image
 * @returns {string} Image type display name
 */
export const getImageTypeLabel = getImageTypeLabelFromUtils

/**
 * Returns the disk type.
 *
 * @param {Image} image - Image
 * @returns {DISK_TYPES} - Disk type
 */
export const getDiskType = ({ DISK_TYPE } = {}) =>
  isNaN(+DISK_TYPE) ? DISK_TYPE : DISK_TYPES[+DISK_TYPE]

/**
 *
 * @param {Image} image - Image
 * @returns {string} - If image is locked/unlocked
 */
export const getImageLocked = getLocked

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

/**
 * Aggregates image enabled state across multiple images.
 *
 * @param {object[]} images - Images with a STATE field
 * @returns {{ allEnabled: boolean, allDisabled: boolean }} - Aggregate enabled status
 */
export const aggregateImageEnabledState = (images) =>
  [].concat(images).reduce(
    (acc, image) => {
      const isDisabled = image?.STATE === '3'

      return {
        allEnabled: acc.allEnabled && !isDisabled,
        allDisabled: acc.allDisabled && isDisabled,
      }
    },
    { allEnabled: true, allDisabled: true }
  )

/**
 * Aggregates image persistence state across multiple images.
 *
 * @param {object[]} images - Images with a PERSISTENT field
 * @returns {{ allPersistent: boolean, nonePersistent: boolean }} - Aggregate persistence status
 */
export const aggregateImagePersistenceState = (images) =>
  [].concat(images).reduce(
    (acc, image) => {
      const isPersistent = image?.PERSISTENT === '1'

      return {
        allPersistent: acc.allPersistent && isPersistent,
        nonePersistent: acc.nonePersistent && !isPersistent,
      }
    },
    { allPersistent: true, nonePersistent: true }
  )
