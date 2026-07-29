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

import { Accounting } from '@modules/resources/resources/User/Tabs/Accounting'
import { Authentication } from '@modules/resources/resources/User/Tabs/Authentication'
import { Group } from '@modules/resources/resources/User/Tabs/Group'
import { Info } from '@modules/resources/resources/User/Tabs/Info'
import { Quota } from '@modules/resources/resources/User/Tabs/Quota'
import { Selection } from '@modules/resources/resources/User/Tabs/Selection'
import { Showback } from '@modules/resources/resources/User/Tabs/Showback'

export { Accounting, Authentication, Group, Info, Quota, Selection, Showback }

export const Single = [Info, Group, Quota, Accounting, Showback, Authentication]

export const Aggregated = [Selection]
