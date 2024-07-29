/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { string } from 'yup'

import { useGetVMGroupsQuery } from 'client/features/OneApi/vmGroup'
import { OPTION_SORTERS, Field, arrayToOptions } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

/** @type {Field} VM Group field */
export const VM_GROUP_FIELD = {
  name: 'VMGROUP.VMGROUP_ID',
  label: T.AssociateToVMGroup,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: () => {
    const { data: vmGroups = [] } = useGetVMGroupsQuery()

    return arrayToOptions(vmGroups, {
      addEmpty: false,
      getText: ({ ID, NAME }) => `#${ID} ${NAME}`,
      getValue: ({ ID }) => ID,
      sorter: OPTION_SORTERS.numeric,
    })
  },
  grid: { md: 12 },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Role field */
export const ROLE_FIELD = {
  name: 'VMGROUP.ROLE',
  label: T.Role,
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

    return arrayToOptions(roles, { addEmpty: false })
  },
  grid: { md: 12 },
  validation: string()
    .trim()
    .default(() => undefined)
    .when('VMGROUP_ID', (vmGroup, schema) =>
      vmGroup ? schema.required() : schema
    ),
}

/** @type {Field[]} List of VM Group fields */
export const FIELDS = [VM_GROUP_FIELD, ROLE_FIELD]
