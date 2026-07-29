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
import { GROUP_LIST_COLUMNS, groupTable } from '@ModelsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field } from '@UtilsModule'
import { ArraySchema, array, string } from 'yup'

const groupSelectorTable = {
  dataCy: 'groups',
  columns: () => groupTable.columns(GROUP_LIST_COLUMNS),
  useData: groupTable.useData,
}

/** @type {Field} Groups table field */
export const GROUPS = {
  name: 'groups',
  label: T.SelectGroup,
  type: INPUT_TYPES.TABLE,
  model: groupSelectorTable,
  selectOnRowClick: true,
  singleSelect: false,
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    isCopyColumn: true,
    size: 'medium',
  },
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FIELDS = [GROUPS]

/** @type {ArraySchema} Datastore table schema */
export const SCHEMA = array(string().trim()).default(() => [])
