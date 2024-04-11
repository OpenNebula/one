/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { mixed, number, boolean, string } from 'yup'
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

const ALIAS = {
  name: 'alias',
  label: 'Alias',
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 6 },
}

const PARENT = {
  name: 'parent',
  label: T.AsAnAlias,
  dependOf: 'alias',
  type: INPUT_TYPES.SELECT,
  htmlType: (alias) => (alias ? INPUT_TYPES.SELECT : INPUT_TYPES.HIDDEN),
  values: (_, context) => {
    const nics = context?.getValues(`networking.NIC`) ?? []

    return [
      { text: '', value: '' },
      ...nics
        /* eslint-disable-next-line no-shadow */
        .filter(({ parent }) => !parent) // filter nic alias
        .map(({ network, nicId, IP = '' }, index) => {
          const textIdentifier = [
            `NIC-${index}`,
            `VNET-${network}`,
            `IPv4-${IP?.slice(0, 16)}`,
            `#${nicId?.slice(0, 10)}`,
          ].join(` | `)

          return { text: textIdentifier, value: nicId }
        }),
    ]
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => ''),
  grid: { md: 6 },
}

const NETWORKSELECTION = {
  name: 'autonetworkselect',
  label: 'Automatic network selection',
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 6 },
}

const RDP = {
  name: 'rdpconnection',
  label: 'Enable RDP',
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 6 },
}
const SSH = {
  name: 'sshconnection',
  label: 'Enable SSH',
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 6 },
}

const FORCEIPV4 = {
  name: 'IP',
  label: 'Force IPv4',
  type: INPUT_TYPES.TEXT,
  validation: number()
    .min(7) // Shortest possible IPv4
    .max(16) // Longest possible
    .default(() => undefined),
  grid: { md: 6 },
}

const FLOATINGIP = {
  name: 'floating_ip',
  label: 'Floating IP',
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 6 },
}

const FORCEIPV6 = {
  name: 'IP6',
  label: 'Force IPv6',
  type: INPUT_TYPES.TEXT,
  validation: number()
    .min(7)
    .max(39)
    .default(() => undefined),
  grid: { md: 6 },
}

const MANAGEMENINTERFACE = {
  name: 'VROUTER_MANAGEMENT',
  label: 'Management interface',
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
  ALIAS,
  PARENT,
  NETWORKSELECTION,
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
