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

const generateSchema = ({ isUpdate, form, groupedDrivers }) => {
  // Get selected driver
  const driver = find(groupedDrivers, { name: form?.driver?.DRIVER })

  let driverFields = driver?.driverFields

  if (isUpdate) {
    driverFields = driverFields.filter((field) => !field.sensitive)
  }

  // Create the corresponding schema
  const schema = driverFields
    ? getObjectSchemaFromFields(driverFields)
    : undefined

  // Return the schema
  return schema || object()
}

/**
 * Create the schema.
 *
 * @param {object} props - Properties of step schema
 * @param {boolean} props.isUpdate - Determine if is update or not
 * @param {object} props.groupedDrivers - Drivers data
 * @returns {ObjectSchema} - Generated schema
 */
export const SCHEMA =
  ({ isUpdate, groupedDrivers }) =>
  (form) =>
    generateSchema({
      isUpdate: isUpdate,
      form: form,
      groupedDrivers: groupedDrivers,
    })
