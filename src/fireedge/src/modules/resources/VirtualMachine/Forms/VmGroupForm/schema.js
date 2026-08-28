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
import { object, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { getVmGroupRoles, vmgroupTable } from '@ModelsModule'
import { arrayToOptions, Field, getValidationFromFields } from '@UtilsModule'

const selectEligibleVmGroups = (result) => ({
  ...result,
  data: []
    .concat(result.data ?? [])
    .filter((vmGroup) => getVmGroupRoles(vmGroup).length),
})

/** VM Group table restricted to groups that can accept a role assignment. */
export const vmGroupSelectionTable = {
  ...vmgroupTable,
  useData: (args, options) =>
    vmgroupTable.useData(args, {
      ...options,
      selectFromResult: selectEligibleVmGroups,
    }),
}

const VM_GROUP = {
  name: 'vmGroupId',
  label: T.VMGroup,
  type: INPUT_TYPES.TABLE,
  model: vmGroupSelectionTable,
  singleSelect: true,
  selectOnRowClick: true,
  getRowId: ({ ID }) => String(ID),
  fieldProps: {
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    preserveState: true,
    isEnableSearchBar: true,
    isEnableSort: true,
    isEnableFilters: true,
    isRowsSelectable: true,
    isMultiRowSelection: false,
    isCopyColumn: false,
  },
  grid: { md: 12 },
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
}

const ROLE = (vmGroups = []) => ({
  name: 'role',
  label: T.Role,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  clearInvalid: true,
  dependOf: 'vmGroupId',
  watcher: (_, { name, formContext }) => {
    formContext.setValue(name, '', {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    })
    formContext.clearErrors(name)
  },
  htmlType: (vmGroupId) =>
    vmGroupId !== undefined && vmGroupId !== null && vmGroupId !== ''
      ? undefined
      : INPUT_TYPES.HIDDEN,
  values: (vmGroupId) => {
    const vmGroup = vmGroups.find(({ ID }) => String(ID) === String(vmGroupId))
    const roles = getVmGroupRoles(vmGroup).map(({ NAME }) => NAME)

    return arrayToOptions(roles, { addEmpty: true })
  },
  grid: { md: 12 },
  validation: string()
    .trim()
    .required()
    .default(() => ''),
})

/**
 * VM Group association fields.
 *
 * @param {object[]} vmGroups - Available VM Groups
 * @returns {Field[]} Form fields
 */
export const FIELDS = (vmGroups = []) => [VM_GROUP, ROLE(vmGroups)]

export const SCHEMA = object(getValidationFromFields(FIELDS()))
