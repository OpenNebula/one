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

import { Accounting } from '@modules/resources/resources/Group/Tabs/Accounting'
import { Info } from '@modules/resources/resources/Group/Tabs/Info'
import { Quota } from '@modules/resources/resources/Group/Tabs/Quota'
import { Showback } from '@modules/resources/resources/Group/Tabs/Showback'
import { Users } from '@modules/resources/resources/Group/Tabs/Users'
import { VLANRules } from '@modules/resources/resources/Group/Tabs/VLANRules'

export { Accounting, Info, Quota, Showback, Users, VLANRules }

export const Single = [Info, Users, Quota, Accounting, Showback, VLANRules]

export const Aggregated = [Info]
