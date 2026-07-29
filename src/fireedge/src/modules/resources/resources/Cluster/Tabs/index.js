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

import { Info } from '@modules/resources/resources/Cluster/Tabs/Info'
import { Selection } from '@modules/resources/resources/Cluster/Tabs/Selection'
import { Datastores } from '@modules/resources/resources/Cluster/Tabs/Datastores'
import { Drs } from '@modules/resources/resources/Cluster/Tabs/Drs'
import { Events } from '@modules/resources/resources/Cluster/Tabs/Events'
import { Hosts } from '@modules/resources/resources/Cluster/Tabs/Hosts'
import { Logs } from '@modules/resources/resources/Cluster/Tabs/Logs'
import { Vnets } from '@modules/resources/resources/Cluster/Tabs/Vnets'

export { Datastores, Drs, Events, Hosts, Info, Logs, Selection, Vnets }

const PROVISION_TAB_IDS = ['events', 'logs']

export const Single = [Info, Hosts, Vnets, Datastores, Drs, Events, Logs]
export const Aggregated = [Selection]

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isProvisionCluster - Cluster belongs to ONEFORM
 * @returns {Array} Cluster single tabs
 */
export const getSingleTabs = ({ isProvisionCluster = false } = {}) =>
  isProvisionCluster
    ? Single
    : Single.filter(({ id }) => !PROVISION_TAB_IDS.includes(id))
