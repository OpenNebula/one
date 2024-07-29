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
import { string } from 'yup'

import { useGetClustersQuery } from 'client/features/OneApi/cluster'
import { OPTION_SORTERS, Field, arrayToOptions } from 'client/utils'
import { T, INPUT_TYPES, VN_DRIVERS_STR } from 'client/constants'

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field} Name field
 */
export const NAME_FIELD = (isUpdate) => ({
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined)
    // if the form is updating then display the name but not change it
    .afterSubmit((name) => (isUpdate ? undefined : name)),
  ...(isUpdate && { fieldProps: { disabled: true } }),
})

/** @type {Field} Description field */
export const DESCRIPTION_FIELD = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Cluster field */
export const CLUSTER_FIELD = {
  name: 'CLUSTER',
  label: T.Cluster,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: () => {
    const { data: clusters = [] } = useGetClustersQuery()

    const temps = arrayToOptions(clusters, {
      addEmpty: false,
      getText: ({ ID, NAME }) => `#${ID} ${NAME}`,
      getValue: ({ ID }) => ID,
      sorter: OPTION_SORTERS.numeric,
    })

    return temps
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

const drivers = Object.keys(VN_DRIVERS_STR)

/** @type {Field} Driver field */
export const DRIVER_FIELD = {
  name: 'VN_MAD',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(drivers, {
      addEmpty: false,
      getText: (key) => VN_DRIVERS_STR[key],
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => drivers[0]),
  grid: { md: 12 },
  notNull: true,
}

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field[]} List of information fields
 */
export const FIELDS = (isUpdate) =>
  [NAME_FIELD(isUpdate), !isUpdate && CLUSTER_FIELD, DESCRIPTION_FIELD].filter(
    Boolean
  )
