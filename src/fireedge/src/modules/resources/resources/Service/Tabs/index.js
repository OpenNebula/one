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

import { Info } from '@modules/resources/resources/Service/Tabs/Info'
import { Log } from '@modules/resources/resources/Service/Tabs/Log'
import { Networks } from '@modules/resources/resources/Service/Tabs/Networks'
import { Roles } from '@modules/resources/resources/Service/Tabs/Roles'
import { Selection } from '@modules/resources/resources/Service/Tabs/Selection'
import { ScheduledActions } from '@modules/resources/resources/Service/Tabs/ScheduledActions'
import { Template } from '@modules/resources/resources/Service/Tabs/Template'

export { Info, Roles, Networks, Log, Selection, Template }

export const Single = [Info, Roles, Networks, Log, ScheduledActions, Template]

export const Aggregated = [Selection, Info]
