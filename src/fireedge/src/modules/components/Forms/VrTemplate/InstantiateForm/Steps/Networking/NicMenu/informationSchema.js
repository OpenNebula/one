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
import { mixed, boolean, array, string } from 'yup'
import { getObjectSchemaFromFields, REG_V4, REG_V6 } from '@UtilsModule'
import { VnsTable, SecurityGroupsTable } from '@modules/components/Tables'

import { T, INPUT_TYPES } from '@ConstantsModule'

const NETWORK = {
  name: 'NETWORK_ID',
  label: T.Network,
  type: INPUT_TYPES.TABLE,
  cy: 'network',
  Table: () => VnsTable.Table,
  singleSelect: true,
  fieldProps: {
    preserveState: true,
  },
  validation: mixed()
    .notRequired('Network ID missing or malformed!')
    .default(() => null),
  grid: { md: 12 },
}

const RDP = {
  name: 'RDP',
  label: T.RdpConnection,
  type: INPUT_TYPES.SWITCH,
  validation: boolean()
    .yesOrNo()
    .default(() => false),
  grid: { md: 6 },
}
const SSH = {
  name: 'SSH',
  label: T.SshConnection,
  type: INPUT_TYPES.SWITCH,
  validation: boolean()
    .yesOrNo()
    .default(() => false),
  grid: { md: 6 },
}

const FORCEIPV4 = {
  name: 'IP',
  label: T.VirtualRouterNICForceIpv4,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .matches(REG_V4, { message: T.InvalidIPv4 })
    .default(() => undefined),
  grid: { md: 6 },
}

const FLOATINGIP = {
  name: 'FLOATING_IP',
  label: T.VirtualRouterNICFloatingIP,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 6 },
}

const FORCEIPV6 = {
  name: 'IP6',
  label: T.VirtualRouterNICForceIpv6,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .matches(REG_V6, { message: T.InvalidIPv6 })
    .default(() => undefined),
  grid: { md: 6 },
}

const MANAGEMENINTERFACE = {
  name: 'VROUTER_MANAGEMENT',
  label: T['nic.card.management'],
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 6 },
}

const SECURITY_GROUPS = {
  name: 'SECURITY_GROUPS',
  label: T.SecurityGroups,
  type: INPUT_TYPES.TABLE,
  cy: 'secgroup',
  Table: () => SecurityGroupsTable.Table,
  singleSelect: true,
  fieldProps: {
    preserveState: true,
  },
  validation: mixed()
    .notRequired('Security Group ID missing or malformed!')
    .default(() => null),
  grid: { md: 12 },
}

export const FIELDS = [
  RDP,
  SSH,
  NETWORK,
  FORCEIPV4,
  FLOATINGIP,
  FORCEIPV6,
  MANAGEMENINTERFACE,
  SECURITY_GROUPS,
]

export const SCHEMA = array().of(getObjectSchemaFromFields(FIELDS))
