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
import { array, object, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { UserAPI } from '@FeaturesModule'
import { getValidationFromFields } from '@UtilsModule'

const userColumns = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  { accessorKey: 'IS_ADMIN_GROUP_LABEL', header: T.Admin },
  { accessorKey: 'ENABLED_LABEL', header: T.Enabled },
  { accessorKey: 'AUTH_DRIVER', header: T.AuthDriver },
]

const getUserTableRow = (user = {}) => {
  const isAdmin = user?.IS_ADMIN_GROUP === true || +user?.IS_ADMIN_GROUP === 1

  return {
    ...user,
    IS_ADMIN_GROUP_LABEL:
      user?.IS_ADMIN_GROUP_LABEL ?? (isAdmin ? T.Yes : T.No),
    ENABLED_LABEL: user?.ENABLED_LABEL ?? (+user?.ENABLED ? T.Yes : T.No),
  }
}

const getUserModel = (filterData) => ({
  dataCy: 'user',
  columns: () => userColumns,
  useData: () => {
    const result = UserAPI.useGetUsersQuery()
    const users = [].concat(result?.data ?? [])
    const data = typeof filterData === 'function' ? filterData(users) : users

    return {
      ...result,
      data: data.map(getUserTableRow),
    }
  },
})

const USERS = (props) => ({
  name: 'users',
  label: T['groups.actions.edit.users.form'],
  type: INPUT_TYPES.TABLE,
  model: getUserModel(props.filterData),
  selectOnRowClick: true,
  fieldProps: {
    preserveState: true,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  },
  singleSelect: false,
  validation: array(string().trim())
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
export const FIELDS = (props) => [USERS(props)]

/**
 * Schema of the form.
 *
 * @param {object} props - Object to get filterData function
 * @returns {object} Schema
 */
export const SCHEMA = (props) => object(getValidationFromFields(FIELDS(props)))
