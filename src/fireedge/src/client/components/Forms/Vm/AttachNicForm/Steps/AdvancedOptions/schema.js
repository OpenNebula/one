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

const RDP = {
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

const ALIAS = nics => ({
  name: 'PARENT',
  label: 'Attach as an alias',
  type: INPUT_TYPES.SELECT,
  values: [{ text: '', value: '' }]
    .concat(nics?.map?.(({ NAME, IP = '', NETWORK = '', NIC_ID = '' } = {}) =>
      ({ text: `${NIC_ID} - ${NETWORK} ${IP}`, value: NAME })
    )),
  validation: yup
    .string()
    .trim()
    .notRequired()
    .default(undefined)
})

const EXTERNAL = {
  name: 'EXTERNAL',
  label: 'External',
  type: INPUT_TYPES.CHECKBOX,
  tooltip: 'The NIC will be attached as an external alias of the VM',
  dependOf: ALIAS.name,
  htmlType: type => !type?.length ? INPUT_TYPES.HIDDEN : undefined,
  validation: yup
    .boolean()
    .transform(value => {
      if (typeof value === 'boolean') return value

      return String(value).toUpperCase() === 'YES'
    })
    .default(false),
  grid: { md: 12 }
}

export const FIELDS = nics => [
  RDP,
  ALIAS(nics),
  EXTERNAL
]

export const SCHEMA = nics =>
  yup.object(getValidationFromFields(FIELDS(nics)))
