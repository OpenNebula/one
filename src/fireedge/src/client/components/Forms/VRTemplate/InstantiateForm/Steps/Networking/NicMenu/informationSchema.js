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
import { mixed, number, boolean } from 'yup'
import { VNetworksTable, SecurityGroupsTable } from 'client/components/Tables'
import { getObjectSchemaFromFields } from 'client/utils'

import { T, INPUT_TYPES } from 'client/constants'

const NETWORK = {
  name: 'network_id',
  label: T.Network,
  type: INPUT_TYPES.TABLE,
  cy: 'network',
  Table: () => VNetworksTable,
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
  name: 'rdpconnection',
  label: T.RdpConnection,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 6 },
}
const SSH = {
  name: 'sshconnection',
  label: T.SshConnection,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 6 },
}

const FORCEIPV4 = {
  name: 'IP',
  label: T.VirtualRouterNICForceIpv4,
  type: INPUT_TYPES.TEXT,
  validation: number()
    .min(7) // Shortest possible IPv4
    .max(16) // Longest possible
    .default(() => undefined),
  grid: { md: 6 },
}

const FLOATINGIP = {
  name: 'floating_ip',
  label: T.VirtualRouterNICFloatingIP,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 6 },
}

const FORCEIPV6 = {
  name: 'IP6',
  label: T.VirtualRouterNICForceIpv6,
  type: INPUT_TYPES.TEXT,
  validation: number()
    .min(7)
    .max(39)
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
  name: 'secgroup',
  label: T.SecurityGroups,
  type: INPUT_TYPES.TABLE,
  cy: 'secgroup',
  Table: () => SecurityGroupsTable,
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

export const SCHEMA = getObjectSchemaFromFields(FIELDS)
