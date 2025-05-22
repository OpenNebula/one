/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { string, array } from 'yup'
import { Field, arrayToOptions, getObjectSchemaFromFields } from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'

/** @type {Field} Name vGPU Profile field */
const PROFILE_FIELD = (hosts) => ({
  name: 'PCI_GPU_PROFILE',
  label: T.Profile,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  multipe: false,
  values: () => {
    if (hosts) {
      const VGPU_PROFILES = Array.from(
        new Set(
          []
            .concat(hosts)
            ?.map((host) =>
              []
                .concat(host?.HOST_SHARE?.PCI_DEVICES?.PCI)
                ?.map(({ PROFILES = '' } = {}) => PROFILES?.split(','))
                ?.flat()
                ?.filter(Boolean)
            )
            ?.flat()
            ?.filter(Boolean)
        )
      )

      return arrayToOptions(VGPU_PROFILES, { addEmpty: false })
    }

    return arrayToOptions([])
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => ''),
  grid: { md: 12 },
})

const isValidSegment = (segment) => {
  const trimmed = segment?.trim()

  return trimmed === '*' || /^[0-9a-fA-F]{4}$/.test(trimmed)
}

const isValidFilter = (filter) => {
  const parts = filter?.split(':').map((p) => p.trim())
  if (parts?.length > 3) return false

  return parts?.every((part) => isValidSegment(part))
}

/** @type {Field} Name PCI_FILTER field */
const PCI_FILTER_FIELD = (hosts) => ({
  name: 'PCI_FILTER',
  label: T.FilterExpression,
  tooltip: T.FilterExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => '')
    .test(
      'valid-pci-filter-expression',
      T.InvalidFilterExpression,
      (value = '') =>
        value === '' ||
        value
          ?.split(',')
          .map((s) => s?.trim())
          .every((expression) => isValidFilter(expression))
    ),
  grid: { md: 12 },
})

/** @type {Field} Name PCI_SHORT_ADDRESS field */
const PCI_SHORT_FIELD = (hosts) => ({
  name: 'PCI_SHORT_ADDRESS',
  label: T.FilterShortAddress,
  type: INPUT_TYPES.AUTOCOMPLETE,
  tooltip: T.FilterShortAddressConcept,
  multiple: true,
  values: () => {
    if (hosts) {
      const PCI_SHORT_ADDRESSES = Array.from(
        new Set(
          []
            .concat(hosts)
            ?.map((host) =>
              []
                .concat(host?.HOST_SHARE?.PCI_DEVICES?.PCI)
                ?.map((device) => device?.SHORT_ADDRESS)
                ?.filter(Boolean)
            )
            ?.flat()
            ?.filter(Boolean)
        )
      )

      return arrayToOptions(PCI_SHORT_ADDRESSES, { addEmpty: false })
    }

    return arrayToOptions([])
  },
  validation: array(string().trim())
    .notRequired()
    .default(() => []),
  grid: { md: 12 },
})

/**
 * @param {object} host - Fetched host
 * @returns {Array} - PCI filter fields
 */
export const PCI_FILTER_FIELDS = (host = {}) => [
  PCI_FILTER_FIELD(host),
  PCI_SHORT_FIELD(host),
]

/**
 * @param {object} host - Fetched host
 * @returns {Array} - PCI profile field
 */
export const PCI_PROFILE_FIELD = (host = {}) => [PROFILE_FIELD(host)]

export const PCI_SCHEMA = getObjectSchemaFromFields([
  ...PCI_PROFILE_FIELD(),
  ...PCI_FILTER_FIELDS(),
])
