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
import { boolean, string, object, ObjectSchema } from 'yup'

import { Field, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

/** @type {Field} RDP connection field */
const RDP_FIELD = {
  name: 'RDP',
  label: T.RdpConnection,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} SSH connection field */
const SSH_FIELD = {
  name: 'SSH',
  label: T.SshConnection,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/**
 * @param {object} currentFormData - Current form data
 * @param {object[]} currentFormData.nics - Nics
 * @returns {Field} Alias field
 */
const ALIAS_FIELD = ({ nics = [] }) => ({
  name: 'PARENT',
  label: T.AsAnAlias,
  dependOf: 'NAME',
  type: (name) => {
    const hasAlias = nics?.some((nic) => nic.PARENT === name)

    return name && hasAlias ? INPUT_TYPES.HIDDEN : INPUT_TYPES.SELECT
  },
  values: (name) => [
    { text: '', value: '' },
    ...nics
      .filter(({ PARENT }) => !PARENT) // filter nic alias
      .filter(({ NAME }) => NAME !== name || !name) // filter it self
      .map((nic) => {
        const { NAME, IP = '', NETWORK = '', NIC_ID = '' } = nic
        const text = [NAME ?? NIC_ID, NETWORK, IP].filter(Boolean).join(' - ')

        return { text, value: NAME }
      }),
  ],
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
})

/** @type {Field} External field */
const EXTERNAL_FIELD = {
  name: 'EXTERNAL',
  label: T.External,
  tooltip: T.ExternalConcept,
  type: INPUT_TYPES.SWITCH,
  dependOf: 'PARENT',
  htmlType: (parent) => !parent?.length && INPUT_TYPES.HIDDEN,
  validation: boolean().yesOrNo(),
}

/**
 * @param {object} [currentFormData] - Current form data
 * @returns {Field[]} List of Graphics fields
 */
export const FIELDS = (currentFormData = {}) => [
  RDP_FIELD,
  SSH_FIELD,
  ALIAS_FIELD(currentFormData),
  EXTERNAL_FIELD,
]

/** @type {ObjectSchema} Advanced options schema */
export const SCHEMA = object(getValidationFromFields(FIELDS()))
