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
import { BaseSchema, object } from 'yup'

import { DRIVER_FIELD, FIELDS as INFORMATION_FIELDS } from './informationSchema'
import { FIELDS as FIELDS_BY_DRIVER, IP_LINK_CONF_FIELD } from './commonFields'

import {
  Section,
  getObjectSchemaFromFields,
  filterFieldsByHypervisor,
} from 'client/utils'
import { T, VN_DRIVERS } from 'client/constants'

/**
 * @param {VN_DRIVERS} driver - Virtual network driver
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @returns {Section[]} Fields
 */
const SECTIONS = (driver, isUpdate) => [
  {
    id: 'information',
    legend: T.Information,
    fields: INFORMATION_FIELDS(isUpdate),
  },
  {
    id: 'configuration',
    legend: T.Configuration,
    fields: filterFieldsByHypervisor(
      [DRIVER_FIELD, ...FIELDS_BY_DRIVER],
      driver
    ),
  },
]

/**
 * @param {VN_DRIVERS} driver - Virtual network driver
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (driver, isUpdate) =>
  getObjectSchemaFromFields(
    SECTIONS(driver, isUpdate)
      .map(({ schema, fields }) => schema ?? fields)
      .flat()
  ).concat(object({ [IP_LINK_CONF_FIELD.name]: IP_LINK_CONF_FIELD.validation }))

export { SECTIONS, SCHEMA, IP_LINK_CONF_FIELD }
