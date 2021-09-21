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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'

import { getValidationFromFields } from 'client/utils'
import { INPUT_TYPES } from 'client/constants'

const RDP_FIELD = {
  name: 'RDP',
  label: 'RDP connection',
  type: INPUT_TYPES.CHECKBOX,
  validation: yup
    .boolean()
    .transform(value => {
      if (typeof value === 'boolean') return value

      return String(value).toUpperCase() === 'YES'
    })
    .default(false),
  grid: { md: 12 }
}

const ALIAS_FIELD = ({ nics = [] } = {}) => ({
  name: 'PARENT',
  label: 'Attach as an alias',
  dependOf: 'NAME',
  type: name => {
    const hasAlias = nics?.some(nic => nic.PARENT === name)

    return name && hasAlias ? INPUT_TYPES.HIDDEN : INPUT_TYPES.SELECT
  },
  values: name => [
    { text: '', value: '' },
    ...nics
      .filter(({ PARENT }) => !PARENT) // filter nic alias
      .filter(({ NAME }) => NAME !== name || !name) // filter it self
      .map(nic => {
        const { NAME, IP = '', NETWORK = '', NIC_ID = '' } = nic
        const text = [NAME ?? NIC_ID, NETWORK, IP].filter(Boolean).join(' - ')

        return { text, value: NAME }
      })
  ],
  validation: yup
    .string()
    .trim()
    .notRequired()
    .default(undefined)
})

const EXTERNAL_FIELD = {
  name: 'EXTERNAL',
  label: 'External',
  type: INPUT_TYPES.CHECKBOX,
  tooltip: 'The NIC will be attached as an external alias of the VM',
  dependOf: ALIAS_FIELD().name,
  htmlType: type => !type?.length ? INPUT_TYPES.HIDDEN : undefined,
  validation: yup
    .boolean()
    .transform(value => {
      if (typeof value === 'boolean') return value

      return String(value).toUpperCase() === 'YES'
    })
    .default(false)
}

export const FIELDS = props => [
  RDP_FIELD,
  ALIAS_FIELD(props),
  EXTERNAL_FIELD
]

export const SCHEMA = yup.object(getValidationFromFields(FIELDS()))
