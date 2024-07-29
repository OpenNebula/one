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
import { BaseSchema, object } from 'yup'

import { DRIVER_FIELD, FIELDS as INFORMATION_FIELDS } from './informationSchema'
import { FIELDS as FIELDS_BY_DRIVER, IP_LINK_CONF_FIELD } from './commonFields'

import {
  Section,
  getObjectSchemaFromFields,
  filterFieldsByHypervisor,
  disableFields,
} from 'client/utils'
import { T, VN_DRIVERS, RESTRICTED_ATTRIBUTES_TYPE } from 'client/constants'

/**
 * @param {VN_DRIVERS} driver - Virtual network driver
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {Section[]} Fields
 */
const SECTIONS = (driver, isUpdate, oneConfig, adminGroup) => [
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
  {
    id: 'configuration',
    legend: T.Configuration,
    fields: disableFields(
      filterFieldsByHypervisor([DRIVER_FIELD, ...FIELDS_BY_DRIVER], driver),
      '',
      oneConfig,
      adminGroup,
      RESTRICTED_ATTRIBUTES_TYPE.VNET
    ),
  },
]

/**
 * @param {VN_DRIVERS} driver - Virtual network driver
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (driver, isUpdate, oneConfig, adminGroup) =>
  getObjectSchemaFromFields(
    SECTIONS(driver, isUpdate, oneConfig, adminGroup)
      .map(({ schema, fields }) => schema ?? fields)
      .flat()
  ).concat(object({ [IP_LINK_CONF_FIELD.name]: IP_LINK_CONF_FIELD.validation }))

export { SECTIONS, SCHEMA, IP_LINK_CONF_FIELD }
