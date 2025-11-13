/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

// Driver
const {
  Actions: ActionsDriver,
  Commands: CommandsDriver,
} = require('server/routes/api/oneform/driver/routes')

const {
  driver,
  drivers,
  driverEnable,
  driverDisable,
  driverSync,
} = require('server/routes/api/oneform/driver/functions')

// Provider
const {
  Actions: ActionsProvider,
  Commands: CommandsProvider,
} = require('server/routes/api/oneform/provider/routes')

const {
  provider,
  providers,
  providerCreate,
  providerUpdate,
  providerDelete,
  providerChmod,
  providerChown,
  providerChgrp,
} = require('server/routes/api/oneform/provider/functions')

// Provision
const {
  Actions: ActionsProvision,
  Commands: CommandsProvision,
} = require('server/routes/api/oneform/provision/routes')

const {
  provision,
  provisionLogs,
  provisions,
  provisionCreate,
  provisionUpdate,
  provisionDelete,
  provisionUndeploy,
  provisionRecover,
  provisionRetry,
  provisionScaleHost,
  provisionAddIp,
  provisionRemoveIp,
  provisionChmod,
  provisionChown,
  provisionChgrp,
} = require('server/routes/api/oneform/provision/functions')

// Routes definition
const driverEndpoints = [
  {
    action: drivers,
    ...CommandsDriver[ActionsDriver.LIST],
  },
  {
    action: driver,
    ...CommandsDriver[ActionsDriver.SHOW],
  },
  {
    action: driverEnable,
    ...CommandsDriver[ActionsDriver.ENABLE],
  },
  {
    action: driverDisable,
    ...CommandsDriver[ActionsDriver.DISABLE],
  },
  {
    action: driverSync,
    ...CommandsDriver[ActionsDriver.SYNC],
  },
]

const providerEndpoints = [
  {
    action: providers,
    ...CommandsProvider[ActionsProvider.LIST],
  },
  {
    action: provider,
    ...CommandsProvider[ActionsProvider.SHOW],
  },
  {
    action: providerCreate,
    ...CommandsProvider[ActionsProvider.CREATE],
  },
  {
    action: providerUpdate,
    ...CommandsProvider[ActionsProvider.UPDATE],
  },
  {
    action: providerDelete,
    ...CommandsProvider[ActionsProvider.DELETE],
  },
  {
    action: providerChmod,
    ...CommandsProvider[ActionsProvider.CHMOD],
  },
  {
    action: providerChown,
    ...CommandsProvider[ActionsProvider.CHOWN],
  },
  {
    action: providerChgrp,
    ...CommandsProvider[ActionsProvider.CHGRP],
  },
]

const provisionEndpoints = [
  {
    action: provisions,
    ...CommandsProvision[ActionsProvision.LIST],
  },
  {
    action: provision,
    ...CommandsProvision[ActionsProvision.SHOW],
  },
  {
    action: provisionLogs,
    ...CommandsProvision[ActionsProvision.LOGS],
  },
  {
    action: provisionCreate,
    ...CommandsProvision[ActionsProvision.CREATE],
  },
  {
    action: provisionUpdate,
    ...CommandsProvision[ActionsProvision.UPDATE],
  },
  {
    action: provisionDelete,
    ...CommandsProvision[ActionsProvision.DELETE],
  },
  {
    action: provisionUndeploy,
    ...CommandsProvision[ActionsProvision.UNDEPLOY],
  },
  {
    action: provisionRecover,
    ...CommandsProvision[ActionsProvision.RECOVER],
  },
  {
    action: provisionRetry,
    ...CommandsProvision[ActionsProvision.RETRY],
  },
  {
    action: provisionScaleHost,
    ...CommandsProvision[ActionsProvision.SCALE],
  },
  {
    action: provisionAddIp,
    ...CommandsProvision[ActionsProvision.ADD_IP],
  },
  {
    action: provisionRemoveIp,
    ...CommandsProvision[ActionsProvision.REMOVE_IP],
  },
  {
    action: provisionChmod,
    ...CommandsProvision[ActionsProvision.CHMOD],
  },
  {
    action: provisionChown,
    ...CommandsProvision[ActionsProvision.CHOWN],
  },
  {
    action: provisionChgrp,
    ...CommandsProvision[ActionsProvision.CHGRP],
  },
]

module.exports = [
  ...driverEndpoints,
  ...providerEndpoints,
  ...provisionEndpoints,
]
