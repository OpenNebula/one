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
import { boolean, string } from 'yup'

import { HYPERVISORS, IMAGE_TYPES_STR, INPUT_TYPES, T } from '@ConstantsModule'
import { ImageAPI } from '@FeaturesModule'
import { getImageType } from '@ModelsModule'
import { Field, clearNames } from '@UtilsModule'
import {
  KERNEL_DS_NAME,
  KERNEL_NAME,
  KERNEL_PATH_ENABLED_NAME,
} from './kernelSchema'

const { lxc } = HYPERVISORS

export const RAMDISK_PATH_ENABLED_NAME = 'OS.RAMDISK_PATH_ENABLED'
export const RAMDISK_DS_NAME = 'OS.INITRD_DS'
export const RAMDISK_NAME = 'OS.INITRD'

const ramdiskValidation = string()
  .trim()
  .notRequired()
  .default(() => undefined)

/** @type {Field} Ramdisk path field  */
export const RAMDISK_PATH_ENABLED = {
  name: RAMDISK_PATH_ENABLED_NAME,
  label: T.CustomPath,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.SWITCH,
  dependOf: [`$extra.${KERNEL_DS_NAME}`, `$extra.${KERNEL_NAME}`],
  fieldProps: (_, form) => {
    const ds = form?.getValues(`extra.${KERNEL_DS_NAME}`)
    const path = form?.getValues(`extra.${KERNEL_NAME}`)
    const ramdisk = form?.getValues(`extra.${RAMDISK_NAME}`)
    const options = {}

    !(ds || path) && (options.disabled = true)
    ramdisk && form?.setValue(`extra.${RAMDISK_PATH_ENABLED_NAME}`, true)

    return options
  },
  validation: boolean()
    .strip()
    .default(() => false),

  grid: { md: 4 },
}

/** @type {Field} Ramdisk DS field  */
export const RAMDISK_DS = {
  name: RAMDISK_DS_NAME,
  label: T.Ramdisk,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: [
    RAMDISK_PATH_ENABLED.name,
    `$extra.${KERNEL_DS_NAME}`,
    `$extra.${KERNEL_NAME}`,
    `$extra.${KERNEL_PATH_ENABLED_NAME}`,
  ],
  htmlType: ([enabled = false] = []) => enabled && INPUT_TYPES.HIDDEN,
  fieldProps: (_, form) => {
    const ds = form?.getValues(`extra.${KERNEL_DS_NAME}`)
    const path = form?.getValues(`extra.${KERNEL_NAME}`)
    const ramdisk = form?.getValues(`extra.${RAMDISK_PATH_ENABLED_NAME}`)

    const options = {}

    !(ds || path) && (options.disabled = true)
    ramdisk && (options.value = null)

    return options
  },
  values: () => {
    const { data: images = [] } = ImageAPI.useGetAllImagesQuery()

    return images
      ?.filter((image) => getImageType(image) === IMAGE_TYPES_STR.RAMDISK)
      ?.map(({ ID, NAME }) => ({
        text: `#${ID} ${NAME}`,
        value: `$FILE[IMAGE_ID=${ID}]`,
      }))
      ?.sort((a, b) => {
        const compareOptions = { numeric: true, ignorePunctuation: true }

        return a.text.localeCompare(b.text, undefined, compareOptions)
      })
  },
  validation: ramdiskValidation.when(
    clearNames(RAMDISK_PATH_ENABLED.name),
    (enabled, schema) => (enabled ? schema.strip() : schema)
  ),
  value: (_, form) => {
    if (
      (form?.getValues(`extra.${RAMDISK_PATH_ENABLED_NAME}`) ||
        !form?.getValues(`extra.${KERNEL_PATH_ENABLED_NAME}`) ||
        !form?.getValues(`extra.${KERNEL_NAME}`) ||
        !form?.getValues(`extra.${KERNEL_DS_NAME}`)) &&
      form?.setValue
    ) {
      form?.setValue(`extra.${RAMDISK_DS_NAME}`, undefined)
    }
  },

  grid: { md: 8 },
}

/** @type {Field} Ramdisk path field  */
export const RAMDISK = {
  name: RAMDISK_NAME,
  label: T.RamdiskPath,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  dependOf: [
    RAMDISK_PATH_ENABLED.name,
    `$extra.${KERNEL_DS_NAME}`,
    `$extra.${KERNEL_NAME}`,
    `$extra.${KERNEL_PATH_ENABLED_NAME}`,
  ],
  fieldProps: (_, form) => {
    const ds = form?.getValues(`extra.${KERNEL_DS_NAME}`)
    const path = form?.getValues(`extra.${KERNEL_NAME}`)
    const ramdisk = form?.getValues(`extra.${RAMDISK_PATH_ENABLED_NAME}`)
    const currentValue = form?.getValues(`extra.${RAMDISK_NAME}`)

    if (
      (ramdisk === false || !(ds || path)) &&
      currentValue &&
      form?.setValue
    ) {
      form?.setValue(`extra.${RAMDISK_NAME}`)
    }

    return ds || path ? {} : { disabled: true }
  },
  htmlType: ([enabled = false] = []) => !enabled && INPUT_TYPES.HIDDEN,
  validation: ramdiskValidation,
  grid: { md: 8 },
}

/** @type {Field[]} List of Ramdisk fields */
export const RAMDISK_FIELDS = [RAMDISK_PATH_ENABLED, RAMDISK, RAMDISK_DS]
