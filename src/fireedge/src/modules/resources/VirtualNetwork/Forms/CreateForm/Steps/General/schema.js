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
import { BaseSchema, string } from 'yup'

import { ClusterAPI } from '@FeaturesModule'
import {
  Section,
  getObjectSchemaFromFields,
  disableFields,
  OPTION_SORTERS,
  Field,
  arrayToOptions,
} from '@UtilsModule'
import { T, RESTRICTED_ATTRIBUTES_TYPE, INPUT_TYPES } from '@ConstantsModule'

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field} Name field
 */
const NAME_FIELD = (isUpdate) => ({
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
const DESCRIPTION_FIELD = {
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
const CLUSTER_FIELD = {
  name: 'CLUSTER',
  label: T.Cluster,
  type: INPUT_TYPES.AUTOCOMPLETE,
  fieldProps: {
    placeholder: T.SelectCluster,
  },
  values: () => {
    const { data: clusters = [] } = ClusterAPI.useGetClustersQuery()

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

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {Field[]} List of information fields
 */
const FIELDS = (isUpdate) =>
  [NAME_FIELD(isUpdate), !isUpdate && CLUSTER_FIELD, DESCRIPTION_FIELD].filter(
    Boolean
  )

/**
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {Section[]} Fields
 */
const SECTIONS = (isUpdate, oneConfig, adminGroup) => [
  {
    id: 'information',
    legend: T.Information,
    fields: disableFields(
      FIELDS(isUpdate),
      '',
      oneConfig,
      adminGroup,
      RESTRICTED_ATTRIBUTES_TYPE.VNET
    ),
  },
]

/**
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (isUpdate, oneConfig, adminGroup) =>
  getObjectSchemaFromFields(
    SECTIONS(isUpdate, oneConfig, adminGroup)
      .map(({ schema, fields }) => schema ?? fields)
      .flat()
  )

export { SECTIONS, SCHEMA }
