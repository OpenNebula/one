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
import { getValidationFromFields } from 'client/utils'
import { mixed, string, object, array } from 'yup'
import {
  VNetworkTemplatesTable,
  VNetworksTable,
} from 'client/components/Tables'

/**
 * @param {string} pathPrefix - Field array path prefix
 * @param {string} tableType - Table type
 * @returns {Array} - List of fields
 */
export const createNetworkFields = (pathPrefix, tableType) => {
  const getPath = (fieldName) =>
    pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName

  return [
    {
      name: getPath('extra'),
      label: T.Extra,
      type: INPUT_TYPES.TEXT,
      cy: 'network',
      validation: string()
        .notRequired()
        .default(() => null),
      grid: { xs: 12, sm: 12, md: 12 },
    },
    {
      name: getPath('netid'),
      type: INPUT_TYPES.TABLE,
      cy: 'network',
      Table: () =>
        ['existing', 'reserve'].includes(tableType)
          ? VNetworksTable
          : VNetworkTemplatesTable,
      singleSelect: true,
      fieldProps: {
        preserveState: true,
      },
      validation: mixed()
        .required('Network ID missing or malformed!')
        .default(() => null),
      grid: { xs: 12, sm: 12, md: 12 },
    },
  ]
}

/**
 * @param {string} pathPrefix - Path
 * @param {string} tableType - Type of table to display
 * @returns {object} - Yup schema
 */
export const createNetworkSchema = (pathPrefix, tableType) => {
  const fields = createNetworkFields(pathPrefix, tableType)

  return object().shape({
    NETWORKS: array().of(object(getValidationFromFields(fields))),
  })
}
