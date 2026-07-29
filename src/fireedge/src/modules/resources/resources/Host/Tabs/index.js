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

import { HostGraphTab } from '@modules/resources/resources/Host/Tabs/Graphs'
import { HostInfoTab } from '@modules/resources/resources/Host/Tabs/Info'
import { HostNumaTab } from '@modules/resources/resources/Host/Tabs/Numa'
import { HostPciTab } from '@modules/resources/resources/Host/Tabs/Pci'
import { HostVmsTab } from '@modules/resources/resources/Host/Tabs/Vms'
import { HostWildsTab } from '@modules/resources/resources/Host/Tabs/Wilds'
import { HostZombiesTab } from '@modules/resources/resources/Host/Tabs/Zombies'
import { Selection } from '@modules/resources/resources/Host/Tabs/Selection'

export const Single = [
  HostInfoTab,
  HostVmsTab,
  HostGraphTab,
  HostWildsTab,
  HostZombiesTab,
  HostPciTab,
  HostNumaTab,
]
export const Aggregated = [Selection]
