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
import { object, ObjectSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { vnTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

/** @type {Field} Virtual Network field */
const NETWORK = ({ model = vnTable, onSelectNetwork } = {}) => ({
  name: 'NETWORK',
  label: T.SelectNetwork,
  type: INPUT_TYPES.TABLE,
  model,
  singleSelect: true,
  selectOnRowClick: true,
  getRowId: (row) => String(row?.NAME),
  stepControl: onSelectNetwork && {
    condition: (selected) => {
      onSelectNetwork(selected)

      return false
    },
    steps: [],
  },
  fieldProps: {
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    isEnableSearchBar: true,
    isEnableSort: true,
    isEnableFilters: true,
    isRowsSelectable: true,
    isMultiRowSelection: false,
    isCopyColumn: false,
  },
  validation: string()
    .trim()
    .required(T.SelectNetwork)
    .default(() => undefined),
  grid: { md: 12 },
})

/**
 * @param {object} params - Field params
 * @returns {Field[]} Virtual Network selection fields
 */
export const FIELDS = (params) => [NETWORK(params)]

/** @type {ObjectSchema} Virtual Network table schema */
export const SCHEMA = object(getValidationFromFields(FIELDS()))
