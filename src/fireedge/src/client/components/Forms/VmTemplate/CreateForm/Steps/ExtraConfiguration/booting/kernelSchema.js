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

import { HYPERVISORS, IMAGE_TYPES_STR, INPUT_TYPES, T } from 'client/constants'
import { useGetAllImagesQuery } from 'client/features/OneApi/image'
import { getType } from 'client/models/Image'
import { Field, clearNames } from 'client/utils'

const { lxc } = HYPERVISORS

export const KERNEL_PATH_ENABLED_NAME = 'OS.KERNEL_PATH_ENABLED'
export const KERNEL_DS_NAME = 'OS.KERNEL_DS'
export const KERNEL_NAME = 'OS.KERNEL'

const kernelValidation = string()
  .trim()
  .notRequired()
  .default(() => undefined)

/** @type {Field} Kernel path field  */
export const KERNEL_PATH_ENABLED = {
  name: KERNEL_PATH_ENABLED_NAME,
  label: T.CustomPath,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.SWITCH,
  fieldProps: (context, form) => {
    if (context?.extra?.OS?.KERNEL) {
      // first render!
      form?.setValue(`extra.${KERNEL_PATH_ENABLED_NAME}`, true)
    }
  },
  validation: boolean()
    .strip()
    .default(() => false),
}

/** @type {Field} Kernel DS field  */
export const KERNEL_DS = {
  name: KERNEL_DS_NAME,
  label: T.Kernel,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: KERNEL_PATH_ENABLED.name,
  htmlType: (enabled) => enabled && INPUT_TYPES.HIDDEN,
  fieldProps: (enabled) => (enabled ? { value: null } : {}),
  values: () => {
    const { data: images = [] } = useGetAllImagesQuery()

    return images
      ?.filter((image) => getType(image) === IMAGE_TYPES_STR.KERNEL)
      ?.map(({ ID, NAME }) => ({
        text: `#${ID} ${NAME}`,
        value: `$FILE[IMAGE_ID=${ID}]`,
      }))
      ?.sort((a, b) => {
        const compareOptions = { numeric: true, ignorePunctuation: true }

        return a.text.localeCompare(b.text, undefined, compareOptions)
      })
  },
  validation: kernelValidation.when(
    clearNames(KERNEL_PATH_ENABLED.name),
    (enabled, schema) => (enabled ? schema.strip() : schema)
  ),
  value: (_, form) => {
    if (
      form?.getValues(`extra.${KERNEL_PATH_ENABLED_NAME}`) &&
      form?.setValue
    ) {
      form?.setValue(`extra.${KERNEL_DS_NAME}`, undefined)
    }
  },
}

/** @type {Field} Kernel path field  */
export const KERNEL = {
  name: KERNEL_NAME,
  label: T.KernelPath,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  dependOf: KERNEL_PATH_ENABLED.name,
  htmlType: (enabled) => !enabled && INPUT_TYPES.HIDDEN,
  fieldProps: (enabled) => (!enabled ? { value: '' } : {}),
  validation: kernelValidation,
  value: (_, form) => {
    const typeKernel = form?.getValues(`extra.${KERNEL_PATH_ENABLED_NAME}`)
    const currentValue = form?.getValues(`extra.${KERNEL_NAME}`)

    if (typeKernel === false && currentValue && form?.setValue) {
      form?.setValue(`extra.${KERNEL_NAME}`, '')
    }
  },
}

/** @type {Field[]} List of Kernel fields */
export const KERNEL_FIELDS = [KERNEL_PATH_ENABLED, KERNEL, KERNEL_DS]
