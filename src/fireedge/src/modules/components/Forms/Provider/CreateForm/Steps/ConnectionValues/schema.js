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
import { getObjectSchemaFromFields } from '@UtilsModule'
import { find } from 'lodash'
import { ObjectSchema, object } from 'yup'

const generateSchema = (form, groupedDrivers) => {
  // Get selected driver
  const driver = find(groupedDrivers, { name: form?.driver?.DRIVER })

  // Create the corresponding schema
  const schema = driver?.driverFields
    ? getObjectSchemaFromFields(driver?.driverFields)
    : undefined

  // Return the schema
  return schema || object()
}

/**
 * Create the schema.
 *
 * @param {object} groupedDrivers - Drivers data
 * @returns {ObjectSchema} - Generated schema
 */
export const SCHEMA = (groupedDrivers) => (form) =>
  generateSchema(form, groupedDrivers)
