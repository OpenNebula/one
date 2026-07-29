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
import { T } from '@ConstantsModule'
import { createTable } from '@UtilsModule'
import { SecurityGroupAPI, VmAPI } from '@FeaturesModule'
import { VM_COLUMNS } from '@modules/models/VirtualMachine/table'
import { createLabelColumn } from '@modules/models/labels'
import { Tag } from '@ComponentsV2Module'

/* eslint-disable jsdoc/require-jsdoc */
export const getSecurityGroupRulesCount = (securityGroup) =>
  [securityGroup?.TEMPLATE?.RULE ?? []].flat().filter(Boolean).length

export const getSecurityGroupResourceCount = (value) => {
  if (typeof value === 'number' || typeof value === 'string') {
    const count = Number(value)

    return Number.isFinite(count) && count >= 0 ? count : 0
  }

  const ids = value?.ID

  return [ids ?? []].flat().filter(Boolean).length
}

export const SECURITYGROUPS_COLUMNS = [
  { header: T.ID, accessorKey: 'ID', id: 'id', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  {
    header: T.Rules,
    id: 'rules',
    accessorFn: getSecurityGroupRulesCount,
  },
  {
    header: T.UpdatedVms,
    id: 'UPDATED_VMS',
    accessorFn: (row) => getSecurityGroupResourceCount(row?.UPDATED_VMS),
  },
  {
    header: T.OutdatedVms,
    id: 'OUTDATED_VMS',
    accessorFn: (row) => getSecurityGroupResourceCount(row?.OUTDATED_VMS),
  },
  {
    header: T.ErrorVms,
    id: 'ERROR_VMS',
    accessorFn: (row) => getSecurityGroupResourceCount(row?.ERROR_VMS),
  },
  { header: T.Owner, accessorKey: 'UNAME', grow: false },
  { header: T.Group, accessorKey: 'GNAME', grow: false },
  createLabelColumn({ grow: false }),
]

export const SECURITYGROUP_SELECTION_COLUMNS = [
  { header: T.ID, accessorKey: 'ID', id: 'id', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  {
    header: T.Rules,
    id: 'rules',
    accessorFn: getSecurityGroupRulesCount,
  },
]

export const RULESECURITYGROUP_COLUMNS = [
  {
    header: T.Protocol,
    id: 'PROTOCOL',
    accessorFn: (row) => row?.PROTOCOL,
  },
  {
    header: T.Type,
    id: 'TYPE',
    accessorFn: (row) => row?.RULE_TYPE,
    cell: ({ row }) =>
      row.original?.RULE_TYPE ? (
        <Tag title={row.original.RULE_TYPE} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.Range,
    id: 'RANGE',
    accessorFn: (row) => row?.RANGE,
  },
  {
    header: T.Network,
    id: 'NETWORK',
    cell: ({ row }) => row.original?.NETWORK,
    meta: { disableCellTooltip: true },
  },
  {
    header: T.IcmpType,
    id: 'ICMP_TYPE',
    accessorFn: (row) => row?.ICMP_TYPE,
  },
  {
    header: T.IcmpTypeV6,
    id: 'ICMPv6_TYPE',
    accessorFn: (row) => row?.ICMPv6_TYPE,
  },
]

const SECGROUP_VM_COLUMN_IDS = [
  'state',
  'id',
  'name',
  'hostname',
  'ips',
  'owner',
  'group',
  'labels',
]

export const SECGROUP_VM_COLUMNS = VM_COLUMNS.filter(({ id }) =>
  SECGROUP_VM_COLUMN_IDS.includes(id)
)

export const secGroupVmTable = createTable(
  SECGROUP_VM_COLUMNS,
  VmAPI.useGetVmInfosetQuery,
  { dataCy: 'security-group-vms' }
)

export const securitygroupTable = createTable(
  SECURITYGROUPS_COLUMNS,
  SecurityGroupAPI.useGetSecGroupsQuery,
  { dataCy: 'security-groups' }
)

export const securitygroupSelectionTable = createTable(
  SECURITYGROUP_SELECTION_COLUMNS,
  SecurityGroupAPI.useGetSecGroupsQuery,
  { dataCy: 'security-groups' }
)
