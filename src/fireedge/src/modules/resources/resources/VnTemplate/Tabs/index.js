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

import { AddressRanges } from '@modules/resources/resources/VnTemplate/Tabs/AddressRanges'
import { Clusters } from '@modules/resources/resources/VnTemplate/Tabs/Clusters'
import { Info } from '@modules/resources/resources/VnTemplate/Tabs/Info'
import { Security } from '@modules/resources/resources/VnTemplate/Tabs/Security'
import { Selection } from '@modules/resources/resources/VnTemplate/Tabs/Selection'
import { Template } from '@modules/resources/resources/VnTemplate/Tabs/Template'

export { AddressRanges, Clusters, Info, Security, Selection, Template }

export const Single = [Info, AddressRanges, Security, Clusters, Template]
export const Aggregated = [Selection, Info]
