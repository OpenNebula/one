/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { string } from 'yup'

import { useGetVMGroupsQuery } from 'client/features/OneApi/vmGroup'
import { INPUT_TYPES } from 'client/constants'

export const VM_GROUP_FIELD = {
  name: 'VMGROUP.VMGROUP_ID',
  label: 'Associate VM to a VM Group',
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: () => {
    const { data: vmGroups = [] } = useGetVMGroupsQuery()

    return vmGroups
      ?.map(({ ID, NAME }) => ({ text: `#${ID} ${NAME}`, value: String(ID) }))
      ?.sort((a, b) => {
        const compareOptions = { numeric: true, ignorePunctuation: true }

        return a.value.localeCompare(b.value, undefined, compareOptions)
      })
  },
  grid: { md: 12 },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

export const ROLE_FIELD = {
  name: 'VMGROUP.ROLE',
  label: 'Role',
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: VM_GROUP_FIELD.name,
  htmlType: (vmGroup) =>
    vmGroup && vmGroup !== '' ? undefined : INPUT_TYPES.HIDDEN,
  values: (vmGroupSelected) => {
    const { data: vmGroups = [] } = useGetVMGroupsQuery()

    const roles = vmGroups
      ?.filter(({ ID }) => ID === vmGroupSelected)
      ?.map(({ ROLES }) =>
        [ROLES?.ROLE ?? []].flat().map(({ NAME: ROLE_NAME }) => ROLE_NAME)
      )
      ?.flat()

    return roles.map((role) => ({ text: role, value: role }))
  },
  grid: { md: 12 },
  validation: string()
    .trim()
    .default(() => undefined)
    .when('VMGROUP_ID', (vmGroup, schema) =>
      vmGroup && vmGroup !== ''
        ? schema.required('Role field is required')
        : schema
    ),
}

export const FIELDS = [VM_GROUP_FIELD, ROLE_FIELD]
