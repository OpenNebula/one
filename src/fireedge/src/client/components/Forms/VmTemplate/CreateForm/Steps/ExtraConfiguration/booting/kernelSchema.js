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
import { boolean, string } from 'yup'

import { useGetImagesQuery } from 'client/features/OneApi/image'
import { getType } from 'client/models/Image'
import { Field, clearNames } from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS, IMAGE_TYPES_STR } from 'client/constants'

const { vcenter, lxc } = HYPERVISORS

const kernelValidation = string()
  .trim()
  .notRequired()
  .default(() => undefined)

/** @type {Field} Kernel path field  */
export const KERNEL_PATH_ENABLED = {
  name: 'OS.KERNEL_PATH_ENABLED',
  label: T.CustomPath,
  notOnHypervisors: [vcenter, lxc],
  type: INPUT_TYPES.SWITCH,
  validation: boolean()
    .strip()
    .default(() => false),
}

/** @type {Field} Kernel DS field  */
export const KERNEL_DS = {
  name: 'OS.KERNEL_DS',
  label: T.Kernel,
  notOnHypervisors: [vcenter, lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: KERNEL_PATH_ENABLED.name,
  htmlType: (enabled) => enabled && INPUT_TYPES.HIDDEN,
  values: () => {
    const { data: images = [] } = useGetImagesQuery()

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
}

/** @type {Field} Kernel path field  */
export const KERNEL = {
  name: 'OS.KERNEL',
  label: T.KernelPath,
  notOnHypervisors: [vcenter, lxc],
  type: INPUT_TYPES.TEXT,
  dependOf: KERNEL_PATH_ENABLED.name,
  htmlType: (enabled) => !enabled && INPUT_TYPES.HIDDEN,
  validation: kernelValidation.when(
    clearNames(KERNEL_PATH_ENABLED.name),
    (enabled, schema) => (enabled ? schema : schema.strip())
  ),
}

/** @type {Field[]} List of Kernel fields */
export const KERNEL_FIELDS = [KERNEL_PATH_ENABLED, KERNEL, KERNEL_DS]
