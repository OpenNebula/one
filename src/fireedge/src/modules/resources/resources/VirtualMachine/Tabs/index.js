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

import { Backup } from '@modules/resources/resources/VirtualMachine/Tabs/Backup'
import { History } from '@modules/resources/resources/VirtualMachine/Tabs/History'
import { Info } from '@modules/resources/resources/VirtualMachine/Tabs/Info'
import { Network } from '@modules/resources/resources/VirtualMachine/Tabs/Network'
import { PCI } from '@modules/resources/resources/VirtualMachine/Tabs/PCI'
import { Storage } from '@modules/resources/resources/VirtualMachine/Tabs/Storage'
import { Snapshot } from '@modules/resources/resources/VirtualMachine/Tabs/Snapshot'
import { ScheduledActions } from '@modules/resources/resources/VirtualMachine/Tabs/ScheduledActions'
import { Configuration } from '@modules/resources/resources/VirtualMachine/Tabs/Configuration'
import { Template } from '@modules/resources/resources/VirtualMachine/Tabs/Template'
import { Logs } from '@modules/resources/resources/VirtualMachine/Tabs/Logs'
import { Selection } from '@modules/resources/resources/VirtualMachine/Tabs/Selection'
import { AggregatedInfo } from '@modules/resources/resources/VirtualMachine/Tabs/AggregatedInfo'

export {
  Info,
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
}

export const Single = [
  Info,
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
]

export const Aggregated = [Selection, AggregatedInfo]
