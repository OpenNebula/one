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
import { array, object, ObjectSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { securitygroupSelectionTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

export const TAB_ID = 'SECURITY_GROUPS'

/** @type {Field} Security groups field */
const SECURITY_GROUPS = (readOnly) => ({
  name: TAB_ID,
  label: T.SecurityGroups,
  type: INPUT_TYPES.TABLE,
  model: securitygroupSelectionTable,
  singleSelect: false,
  selectOnRowClick: true,
  readOnly,
  validation: array(string().trim())
    .ensure()
    .default(() => []),
  fieldProps: {
    isEnableSearchBar: true,
    isEnableSort: true,
    isEnableFilters: true,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    isCopyColumn: true,
    size: 'medium',
  },
  grid: { md: 12 },
})

/** @type {Field[]} Security groups fields */
export const FIELDS = (readOnly = false) => [SECURITY_GROUPS(readOnly)]

/** @type {ObjectSchema} Security groups schema */
export const SCHEMA = object(getValidationFromFields(FIELDS()))
