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

import { Backup } from '@modules/resources/VirtualMachine/Tabs/Backup'
import { History } from '@modules/resources/VirtualMachine/Tabs/History'
import { Info } from '@modules/resources/VirtualMachine/Tabs/Info'
import { VmGroup } from '@modules/resources/VirtualMachine/Tabs/VmGroup'
import { Network } from '@modules/resources/VirtualMachine/Tabs/Network'
import { PCI } from '@modules/resources/VirtualMachine/Tabs/PCI'
import { Storage } from '@modules/resources/VirtualMachine/Tabs/Storage'
import { Snapshot } from '@modules/resources/VirtualMachine/Tabs/Snapshot'
import { ScheduledActions } from '@modules/resources/VirtualMachine/Tabs/ScheduledActions'
import { Configuration } from '@modules/resources/VirtualMachine/Tabs/Configuration'
import { Template } from '@modules/resources/VirtualMachine/Tabs/Template'
import { Logs } from '@modules/resources/VirtualMachine/Tabs/Logs'
import { Selection } from '@modules/resources/VirtualMachine/Tabs/Selection'
import { AggregatedInfo } from '@modules/resources/VirtualMachine/Tabs/AggregatedInfo'
import { Exec } from '@modules/resources/VirtualMachine/Tabs/Exec'

export {
  Info,
  VmGroup,
  Storage,
  Network,
  PCI,
  Snapshot,
  Backup,
  History,
  ScheduledActions,
  Configuration,
  Template,
  Logs,
  Exec,
}

export const Single = [
  Info,
  VmGroup,
  Storage,
  Network,
  PCI,
  Snapshot,
  Backup,
  History,
  ScheduledActions,
  Configuration,
  Template,
  Logs,
  Exec,
]

export const Aggregated = [Selection, AggregatedInfo]
