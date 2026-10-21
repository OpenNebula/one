/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { string } from 'yup'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { getObjectSchemaFromFields } from '@UtilsModule'

/**
 * @param {object} props - Form options
 * @param {boolean} props.isNodeGroup - Recover a node group
 * @returns {object[]} Recovery fields
 */
export const FIELDS = ({ isNodeGroup = false } = {}) => [
  {
    name: 'action',
    label: T.Operation,
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: [
      { text: T.Retry, value: 'retry' },
      { text: T.Success, value: 'success' },
      { text: T.Failure, value: 'failure' },
      ...(!isNodeGroup ? [{ text: T.DeleteDb, value: 'delete-db' }] : []),
    ],
    validation: string()
      .required()
      .oneOf(
        isNodeGroup
          ? ['retry', 'success', 'failure']
          : ['retry', 'success', 'failure', 'delete-db']
      )
      .default('retry'),
    grid: { md: 12 },
  },
]

/**
 * @param {object} props - Form options
 * @returns {object} Recovery schema
 */
export const SCHEMA = (props) => getObjectSchemaFromFields(FIELDS(props))
