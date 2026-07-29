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
import { imageTable } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

/** @type {Field} Image field */
const IMAGE = ({ model = imageTable, onSelectImage } = {}) => ({
  name: 'ID',
  label: T.Image,
  type: INPUT_TYPES.TABLE,
  model,
  singleSelect: true,
  selectOnRowClick: true,
  getRowId: (row) => String(row?.ID),
  stepControl: onSelectImage && {
    condition: (selected) => {
      onSelectImage(selected)

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
    .required(T.SelectAImage)
    .default(() => undefined),
  grid: { md: 12 },
})

/**
 * @param {object} params - Field params
 * @returns {Field[]} Image selection fields
 */
export const FIELDS = (params) => [IMAGE(params)]

/** @type {ObjectSchema} Image selection step schema */
export const SCHEMA = object(getValidationFromFields(FIELDS()))
