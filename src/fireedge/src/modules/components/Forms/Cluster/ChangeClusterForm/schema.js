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
import { array, lazy, string, object, ObjectSchema } from 'yup'

import { ClustersTable } from '@modules/components/Tables'
import { T, INPUT_TYPES } from '@ConstantsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

/** @type {Field} Cluster field */
const CLUSTER = ({ singleSelect = true }) => ({
  name: 'cluster',
  label: T.SelectNewCluster,
  type: INPUT_TYPES.TABLE,
  Table: () => ClustersTable.Table,
  singleSelect: singleSelect,
  fieldProps: {
    preserveState: true,
  },
  grid: { md: 12 },
  validation: lazy(() =>
    singleSelect
      ? string()
          .trim()
          .required()
          .default(() => undefined)
      : array(string().trim())
          .required()
          .default(() => undefined)
  ),
})

/** @type {Field[]} List of fields */
export const FIELDS = (params) => [CLUSTER(params)]

/** @type {ObjectSchema} Schema */
export const SCHEMA = (params) =>
  object(getValidationFromFields(FIELDS(params)))
