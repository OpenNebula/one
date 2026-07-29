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
import { array, lazy, object, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { GroupAPI } from '@FeaturesModule'
import { getGroupQuotaUsage } from '@ModelsModule'
import { getValidationFromFields } from '@UtilsModule'

const getTotalUsers = ({ TOTAL_USERS, USERS } = {}) => {
  if (TOTAL_USERS !== undefined) return TOTAL_USERS

  return []
    .concat(USERS?.ID ?? [])
    .filter((id) => id !== undefined && id !== null).length
}

const getGroupTableRow = (group = {}) => {
  const vmQuotaUsage = getGroupQuotaUsage('VM', group?.VM_QUOTA)
  const datastoreQuotaUsage = getGroupQuotaUsage(
    'DATASTORE',
    group?.DATASTORE_QUOTA
  )
  const networkQuotaUsage = getGroupQuotaUsage('NETWORK', group?.NETWORK_QUOTA)
  const imageQuotaUsage = getGroupQuotaUsage('IMAGE', group?.IMAGE_QUOTA)

  return {
    ...group,
    TOTAL_USERS_LABEL: getTotalUsers(group),
    VM_QUOTA_LABEL: vmQuotaUsage?.vms?.percentLabel ?? '-',
    DATASTORE_QUOTA_LABEL: datastoreQuotaUsage?.size?.percentLabel ?? '-',
    NETWORK_QUOTA_LABEL: networkQuotaUsage?.leases?.percentLabel ?? '-',
    IMAGE_QUOTA_LABEL: imageQuotaUsage?.rvms?.percentLabel ?? '-',
  }
}

const groupColumns = [
  { accessorKey: 'ID', header: T.ID, width: '10%' },
  { accessorKey: 'NAME', header: T.Name, width: '24%' },
  { accessorKey: 'TOTAL_USERS_LABEL', header: T.Users },
  { accessorKey: 'VM_QUOTA_LABEL', header: T.VMs },
  { accessorKey: 'DATASTORE_QUOTA_LABEL', header: T.Datastores },
  { accessorKey: 'NETWORK_QUOTA_LABEL', header: T.Networks },
  { accessorKey: 'IMAGE_QUOTA_LABEL', header: T.ImageRVMS },
]

const getGroupModel = (filterData) => ({
  columns: () => groupColumns,
  useData: () => {
    const result = GroupAPI.useGetGroupsQuery()
    const groups = [].concat(result?.data ?? [])
    const data = typeof filterData === 'function' ? filterData(groups) : groups

    return {
      ...result,
      data: data.map(getGroupTableRow),
    }
  },
})

const GROUPS = (props) => ({
  name: 'groups',
  label: T['user.actions.edit.group.form'],
  type: INPUT_TYPES.TABLE,
  model: getGroupModel(props.filterData),
  selectOnRowClick: true,
  fieldProps: {
    preserveState: true,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  },
  singleSelect: props.singleSelect === true,
  validation: lazy(() =>
    props.singleSelect
      ? string()
          .trim()
          .required()
          .default(() => undefined)
      : array(string().trim())
          .required()
          .default(() => undefined)
  ),
  grid: { md: 12 },
})

/**
 * Fields of the form.
 *
 * @param {object} props - Object to get filterData function
 * @returns {object} Fields
 */
export const FIELDS = (props) => [GROUPS(props)]

/**
 * Schema of the form.
 *
 * @param {object} props - Object to get filterData function
 * @returns {object} Schema
 */
export const SCHEMA = (props) => object(getValidationFromFields(FIELDS(props)))
