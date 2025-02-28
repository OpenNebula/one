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
import { BaseSchema } from 'yup'

import { FIELDS as INFORMATION_FIELDS } from './informationSchema'

import { Section, getObjectSchemaFromFields, disableFields } from '@UtilsModule'
import { T, RESTRICTED_ATTRIBUTES_TYPE } from '@ConstantsModule'

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
      INFORMATION_FIELDS(isUpdate),
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
