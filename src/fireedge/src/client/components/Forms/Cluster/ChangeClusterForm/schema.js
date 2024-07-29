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
import { string, object, ObjectSchema, array } from 'yup'

import { ClustersTable } from 'client/components/Tables'
import { T, INPUT_TYPES } from 'client/constants'
import { Field, getValidationFromFields } from 'client/utils'

/** @type {Field} Cluster field */
const CLUSTER = {
  name: 'cluster',
  label: T.SelectNewCluster,
  type: INPUT_TYPES.TABLE,
  Table: () => ClustersTable,
  singleSelect: false,
  validation: array(string().trim())
    .required()
    .default(() => undefined),
  fieldProps: {
    preserveState: true,
  },
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FIELDS = [CLUSTER]

/** @type {ObjectSchema} Schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
