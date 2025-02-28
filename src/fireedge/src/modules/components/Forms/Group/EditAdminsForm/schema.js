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
import { array, string, object } from 'yup'

import { UsersTable } from '@modules/components/Tables'
import { getValidationFromFields } from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'

const ADMINS = (props) => ({
  name: 'admins',
  label: T['groups.actions.edit.admins.form'],
  type: INPUT_TYPES.TABLE,
  Table: () => UsersTable.Table,
  fieldProps: {
    filterData: props.filterData,
    preserveState: true,
  },
  singleSelect: false,
  validation: array(string())
    .required()
    .default(() => undefined),
  grid: { md: 12 },
})

/**
 * Fields of the form.
 *
 * @param {object} props - Object to get filterData function
 * @returns {object} Fields
 */
export const FIELDS = (props) => [ADMINS(props)]

/**
 * Schema of the form.
 *
 * @param {object} props - Object to get filterData function
 * @returns {object} Schema
 */
export const SCHEMA = (props) => object(getValidationFromFields(FIELDS(props)))
