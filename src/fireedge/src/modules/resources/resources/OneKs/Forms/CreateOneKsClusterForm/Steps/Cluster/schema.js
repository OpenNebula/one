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
import { object, string } from 'yup'

import { clusterSelectionTable } from '@ModelsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

/** @type {Field} Cluster field */
const CLUSTER = {
  name: 'cluster',
  label: T.SelectCluster,
  type: INPUT_TYPES.TABLE,
  model: clusterSelectionTable,
  singleSelect: true,
  selectOnRowClick: true,
  fieldProps: {
    preserveState: true,
  },
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FIELDS = [CLUSTER]

/** @type {object} Cluster step schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
