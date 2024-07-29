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
import { INPUT_TYPES, T } from 'client/constants'
import { arrayToOptions, getObjectSchemaFromFields } from 'client/utils'
import { number, string } from 'yup'

export const constants = {
  expireFieldName: 'EXPIRE',
  groupFieldName: 'EGID',
  expireFieldDefault: 36000,
  groupFieldDefault: '-1',
}

const EXPIRE_FIELD = {
  name: constants.expireFieldName,
  label: T.Expiration,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .min(0)
    .notRequired()
    .default(() => constants.expireFieldDefault),
  grid: { md: 12 },
}

const GROUP_FIELD = (userGroups) => ({
  name: constants.groupFieldName,
  label: T.Group,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(userGroups, {
      addEmpty: '-',
      addEmptyValue: constants.groupFieldDefault,
      getText: ({ NAME }) => NAME,
      getValue: ({ ID }) => ID,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => constants.groupFieldDefault),
  grid: { md: 12 },
})

/**
 * @param {object[]} userGroups - user groups
 * @returns {object[]} fields
 */
export const FIELDS = (userGroups) => [EXPIRE_FIELD, GROUP_FIELD(userGroups)]

/**
 * @param {object[]} userGroups - user groups
 * @returns {object[]} schema
 */
export const SCHEMA = (userGroups) =>
  getObjectSchemaFromFields(FIELDS(userGroups))
