/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { createAction } from 'client/features/One/utils'
import { provisionService } from 'client/features/One/provision/services'
import { RESOURCES } from 'client/features/One/slice'

export const getProvisionsTemplates = createAction(
  'provisions-template/pool',
  provisionService.getProvisionsTemplates,
  (res) => ({ [RESOURCES.document.defaults]: res })
)

export const createProvisionTemplate = createAction(
  'provisions-template/create',
  provisionService.createProvisionTemplate
)

export const getProvision = createAction(
  'provision',
  provisionService.getProvision
)

export const getProvisions = createAction(
  'provision/pool',
  provisionService.getProvisions,
  (res) => ({ [RESOURCES.document[103]]: res })
)

export const createProvision = createAction(
  'provision/create',
  provisionService.createProvision
)
export const configureProvision = createAction(
  'provision/configure',
  provisionService.configureProvision
)
export const deleteProvision = createAction(
  'provision/delete',
  provisionService.deleteProvision
)
export const getProvisionLog = createAction(
  'provision/log',
  provisionService.getProvisionLog
)

export const deleteDatastore = createAction(
  'provision/datastore/delete',
  provisionService.deleteDatastore
)
export const deleteVNetwork = createAction(
  'provision/vnet/delete',
  provisionService.deleteVNetwork
)
export const deleteHost = createAction(
  'provision/host/delete',
  provisionService.deleteHost
)
export const configureHost = createAction(
  'provision/host/configure',
  provisionService.configureHost
)
export const addHost = createAction(
  'provision/host/add',
  provisionService.addHost
)
export const addIp = createAction('provision/ip/add', provisionService.addIp)
