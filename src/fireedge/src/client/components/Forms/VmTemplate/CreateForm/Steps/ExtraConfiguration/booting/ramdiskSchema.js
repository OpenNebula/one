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
import { string, boolean } from 'yup'

import { useImage } from 'client/features/One'
import { getType } from 'client/models/Image'
import { Field, clearNames } from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS, IMAGE_TYPES_STR } from 'client/constants'

const { vcenter, lxc, firecracker } = HYPERVISORS

const ramdiskValidation = string().trim().notRequired().default(() => undefined)

/** @type {Field} Ramdisk path field  */
export const RAMDISK_PATH_ENABLED = {
  name: 'OS.RAMDISK_PATH_ENABLED',
  label: T.CustomPath,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SWITCH,
  validation: boolean().strip().default(() => false)
}

/** @type {Field} Ramdisk DS field  */
export const RAMDISK_DS = {
  name: 'OS.INITRD_DS',
  label: T.Ramdisk,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: RAMDISK_PATH_ENABLED.name,
  htmlType: enabled => enabled && INPUT_TYPES.HIDDEN,
  values: () => {
    const images = useImage()

    return images
      ?.filter(image => getType(image) === IMAGE_TYPES_STR.RAMDISK)
      ?.map(({ ID, NAME }) => ({ text: `#${ID} ${NAME}`, value: `$FILE[IMAGE_ID=${ID}]` }))
      ?.sort((a, b) => {
        const compareOptions = { numeric: true, ignorePunctuation: true }

        return a.value.localeCompare(b.value, undefined, compareOptions)
      })
  },
  validation: ramdiskValidation.when(
    clearNames(RAMDISK_PATH_ENABLED.name),
    (enabled, schema) => enabled ? schema.strip() : schema
  )
}

/** @type {Field} Ramdisk path field  */
export const RAMDISK = {
  name: 'OS.INITRD',
  label: T.RamdiskPath,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.TEXT,
  dependOf: RAMDISK_PATH_ENABLED.name,
  htmlType: enabled => !enabled && INPUT_TYPES.HIDDEN,
  validation: ramdiskValidation.when(
    clearNames(RAMDISK_PATH_ENABLED.name),
    (enabled, schema) => enabled ? schema : schema.strip()
  )
}

/** @type {Field[]} List of Ramdisk fields */
export const RAMDISK_FIELDS = [RAMDISK_PATH_ENABLED, RAMDISK, RAMDISK_DS]
