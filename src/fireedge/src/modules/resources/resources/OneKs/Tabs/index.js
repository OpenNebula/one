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

import { Info } from '@modules/resources/resources/OneKs/Tabs/Info'
import NodeGroups from '@modules/resources/resources/OneKs/Tabs/NodeGroups'
import Kubeconfig from '@modules/resources/resources/OneKs/Tabs/Kubeconfig'
import Logs from '@modules/resources/resources/OneKs/Tabs/Logs'
import Events from '@modules/resources/resources/OneKs/Tabs/Events'
import { Selection } from '@modules/resources/resources/OneKs/Tabs/Selection'

export { Events, Info, Kubeconfig, Logs, NodeGroups, Selection }

export const Single = [Info, NodeGroups, Logs, Events, Kubeconfig]
export const Aggregated = [Selection, Info]
