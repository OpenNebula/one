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
import { getObjectSchemaFromFields, arrayToOptions } from 'client/utils'
import { INPUT_TYPES } from 'client/constants'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'

// Define the network types
export const NETWORK_TYPES = {
  create: 'Create',
  reserve: 'Reserve',
  existing: 'Existing',
}

// Network Type Field
const NETWORK_TYPE = {
  name: 'type',
  label: 'Type',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.values(NETWORK_TYPES), { addEmpty: false }),
  validation: string()
    .trim()
    .oneOf([...Object.keys(NETWORK_TYPES), ...Object.values(NETWORK_TYPES)])
    .default(() => Object.values(NETWORK_TYPES)[0]),
  grid: { md: 2 },
}

// Network Name Field
const NAME = {
  name: 'name',
  label: 'Name',
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { md: 2.5 },
}

// Network Description Field
const DESCRIPTION = {
  name: 'description',
  label: 'Description',
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 2.5 },
}

// Network Selection Field (for 'reserve' or 'existing')
const NETWORK_SELECTION = {
  name: 'network',
  label: 'Network',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { data: vnets = [] } = useGetVNetworksQuery()
    const networks = vnets
      .map((vnet) => ({ NAME: vnet?.NAME, ID: vnet?.ID }))
      .flat()

    return arrayToOptions(networks, {
      getText: (network = '') => network?.NAME,
      getValue: (network) => network?.ID,
    })
  },
  dependOf: NETWORK_TYPE.name,
  validation: string().trim().notRequired(),
  grid: { sm: 2, md: 2 },
}

// NetExtra Field
const NETEXTRA = {
  name: 'netextra',
  label: 'Extra',
  type: INPUT_TYPES.TEXT,
  dependOf: NETWORK_TYPE.name,
  validation: string().trim().when(NETWORK_TYPE.name, {
    is: 'existing',
    then: string().strip(),
    otherwise: string().notRequired(),
  }),
  grid: { md: 2.5 },
}

// List of Network Input Fields
export const NETWORK_INPUT_FIELDS = [
  NETWORK_TYPE,
  NAME,
  DESCRIPTION,
  NETWORK_SELECTION,
  NETEXTRA,
]

export const NETWORK_INPUT_SCHEMA =
  getObjectSchemaFromFields(NETWORK_INPUT_FIELDS)
