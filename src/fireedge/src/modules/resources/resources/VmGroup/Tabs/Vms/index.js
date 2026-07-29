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

import PropTypes from 'prop-types'
import { Component } from 'react'
import { TablePanel } from '@ComponentsV2Module'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { vmgroupVmTable, VMGROUP_VM_COLUMNS } from '@ModelsModule'

const VMGROUP_VM_RESOURCE_COLUMNS = VMGROUP_VM_COLUMNS.filter(
  ({ id }) => !['owner', 'group'].includes(id)
)
const VMGROUP_VM_OWNERSHIP_COLUMNS = VMGROUP_VM_COLUMNS.filter(({ id }) =>
  ['owner', 'group'].includes(id)
)

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Service Templates roles info tab
 */
export const VMs = ({ data, config }) => {
  const { vms, isLoadingVms } = data

  const aVms = [].concat(vms)

  return (
    <TablePanel
      key={'Templates-Tab'}
      columns={vmgroupVmTable.columns([
        ...VMGROUP_VM_RESOURCE_COLUMNS,
        {
          header: T.Role,
          id: 'role',
          accessorFn: (row) =>
            []
              .concat(aVms?.ROLES?.ROLE)
              .find((r) => r?.VMS?.split(',').includes(row?.ID))?.NAME ?? '-',
        },
        {
          header: T.Policy,
          id: 'affinity',
          accessorFn: (row) =>
            []
              .concat(aVms?.ROLES?.ROLE)
              .find((r) => r?.VMS?.split(',').includes(row?.ID))?.POLICY ?? '-',
        },
        ...VMGROUP_VM_OWNERSHIP_COLUMNS,
      ])}
      data={aVms}
      isLoading={isLoadingVms}
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.VM}
    />
  )
}

VMs.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

VMs.id = 'vms'
VMs.title = T.VMs
