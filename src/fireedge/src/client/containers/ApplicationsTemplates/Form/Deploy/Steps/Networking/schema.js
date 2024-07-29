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
import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'
import { useGetVNTemplatesQuery } from 'client/features/OneApi/networkTemplate'
import { getValidationFromFields } from 'client/utils'

const SELECT = {
  template: 'template',
  network: 'network',
}

const TYPES_NETWORKS = [
  { text: 'Create', value: 'template_id', select: SELECT.template },
  { text: 'Reserve', value: 'reserve_from', select: SELECT.network },
  { text: 'Existing', value: 'id', select: SELECT.network, extra: false },
]

const hasExtraValue = (type) =>
  TYPES_NETWORKS.some(({ value, extra }) => value === type && extra === false)

const TYPE = {
  name: 'type',
  label: 'Select a type',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: TYPES_NETWORKS,
  validation: yup
    .string()
    .oneOf(TYPES_NETWORKS.map(({ value }) => value))
    .required('Type field is required')
    .default(TYPES_NETWORKS[0].value),
}

const ID_VNET = {
  name: 'idVnet',
  label: 'Select a network',
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: TYPE.name,
  values: (dependValue) => {
    const { data: vNetworks = [] } = useGetVNetworksQuery()
    const { data: vNetworksTemplates = [] } = useGetVNTemplatesQuery()

    const type = TYPES_NETWORKS.find(({ value }) => value === dependValue)

    const values =
      type?.select === SELECT.network ? vNetworks : vNetworksTemplates

    return values
      .map(({ ID: value, NAME: text }) => ({ text, value }))
      .sort((a, b) => a.value - b.value)
  },
  validation: yup
    .string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      TYPES_NETWORKS.some(
        ({ value, select }) => type === value && select === SELECT.network
      )
        ? schema.required('Network field is required')
        : schema.required('Network template field is required')
    )
    .default(undefined),
}

const EXTRA = {
  name: 'extra',
  label: 'Extra',
  multiline: true,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: (dependValue) =>
    hasExtraValue(dependValue) ? INPUT_TYPES.HIDDEN : INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      hasExtraValue(type) ? schema.strip() : schema
    )
    .default(''),
}

export const FORM_FIELDS = [TYPE, ID_VNET, EXTRA]

export const NETWORK_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
)

export const STEP_FORM_SCHEMA = yup.array(NETWORK_FORM_SCHEMA).default([])
