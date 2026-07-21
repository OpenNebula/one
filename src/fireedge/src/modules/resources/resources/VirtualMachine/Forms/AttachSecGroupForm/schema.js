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
import { string, object } from 'yup'

import { securitygroupSelectionTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'

/** @type {Field} Security group field */
const SEC_GROUP = () => ({
  name: 'secgroup',
  label: T.SelectTheNewSecurityGroup,
  type: INPUT_TYPES.TABLE,
  model: securitygroupSelectionTable,
  singleSelect: true,
  selectOnRowClick: true,
  fieldProps: {
    defaultPageSize: 5,
    isCopyColumn: false,
    isEnableFilters: true,
    isEnableSearchBar: true,
    isEnableSort: true,
    pageSizeOptions: [5, 10, 20],
    preserveState: true,
  },
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
})

/** @returns {Field[]} Security group selection fields */
export const FIELDS = () => [SEC_GROUP()]

export const SCHEMA = object(getValidationFromFields(FIELDS()))
