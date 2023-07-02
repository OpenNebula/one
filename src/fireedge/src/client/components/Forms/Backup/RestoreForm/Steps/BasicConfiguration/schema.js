/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { INPUT_TYPES, T } from 'client/constants'
import { timeFromMilliseconds } from 'client/models/Helper'
import { Field, arrayToOptions, getValidationFromFields } from 'client/utils'
import { ObjectSchema, boolean, object, string } from 'yup'

const NO_NIC = {
  name: 'no_nic',
  label: T.DoNotRestoreNICAttributes,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { xs: 12, md: 6 },
}

const NO_IP = {
  name: 'no_ip',
  label: T.DoNotRestoreIPAttributes,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { xs: 12, md: 6 },
}

const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string(),
  grid: { xs: 12, md: 6 },
}

const INCREMENT_ID = ({ increments = [] }) => ({
  name: 'increment_id',
  label: T.IncrementId,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(increments, {
    addEmpty: true,
    getText: (increment) =>
      `${increment.id}: ${timeFromMilliseconds(increment.date)
        .toFormat('ff')
        .replace(',', '')} (${increment.source})`,
    getValue: (increment) => increment.id,
  }),
  validation: string(),
  grid: { xs: 12, md: 6 },
  fieldProps: {
    disabled: increments.length === 0,
  },
})

/**
 * @param {object} [data] - Backup data
 * @returns {Field[]} Fields
 */
export const FIELDS = (data = {}) => [NAME, INCREMENT_ID(data), NO_NIC, NO_IP]

/**
 * @param {object} [data] - Backup data
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (data) => object(getValidationFromFields(FIELDS(data)))
