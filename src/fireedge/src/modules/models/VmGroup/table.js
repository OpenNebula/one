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

import { createTable, getLockIcon } from '@UtilsModule'
import { VmGroupAPI, VmAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { VM_COLUMNS } from '@modules/models/VirtualMachine/table'
import {
  getVmGroupTotalRoles,
  getVmGroupTotalVms,
} from '@modules/models/VmGroup/general'
import { createLabelColumn } from '@modules/models/labels'
import { Box } from '@mui/material'

/* eslint-disable jsdoc/require-jsdoc */
export const VMGROUP_COLUMNS = [
  {
    accessorKey: 'ID',
    header: T.ID,
    grow: false,
  },
  {
    accessorKey: 'NAME',
    header: T.Name,
    truncate: true,
    cell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{row.original?.NAME}</span>
        {getLockIcon(row.original)}
      </Box>
    ),
  },
  {
    header: T.Roles,
    id: 'roles',
    accessorFn: getVmGroupTotalRoles,
  },
  {
    header: T.VMs,
    id: 'vms',
    accessorFn: getVmGroupTotalVms,
  },
  {
    accessorKey: 'UNAME',
    header: T.Owner,
    grow: false,
  },
  {
    accessorKey: 'GNAME',
    header: T.Group,
    grow: false,
  },
  createLabelColumn({ grow: false }),
]

const VMGROUP_VM_COLUMN_IDS = ['id', 'name', 'state', 'owner', 'group']

export const VMGROUP_VM_COLUMNS = VM_COLUMNS.filter(({ id }) =>
  VMGROUP_VM_COLUMN_IDS.includes(id)
)

export const vmgroupVmTable = createTable(
  VMGROUP_VM_COLUMNS,
  VmAPI.useGetVmInfosetQuery,
  { dataCy: 'vm-group-vms' }
)

export const vmgroupTable = createTable(
  VMGROUP_COLUMNS,
  VmGroupAPI.useGetVMGroupsQuery,
  { dataCy: 'vm-groups' }
)
