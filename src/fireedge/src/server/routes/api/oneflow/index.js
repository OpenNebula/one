/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

const {
  Actions: ActionsService,
  Commands: CommandsService,
} = require('server/routes/api/oneflow/service/routes')
const {
  service,
  serviceDelete,
  serviceAddAction,
  serviceAddScale,
  serviceAddRoleAction,
  serviceAddRole,
  serviceAddSchedAction,
  serviceUpdateSchedAction,
  serviceDeleteSchedAction,
} = require('server/routes/api/oneflow/service/functions')
const {
  Actions: ActionsTemplate,
  Commands: CommandsTemplate,
} = require('server/routes/api/oneflow/template/routes')
const {
  serviceTemplate,
  serviceTemplateDelete,
  serviceTemplateCreate,
  serviceTemplateUpdate,
  serviceTemplateAction,
} = require('server/routes/api/oneflow/template/functions')

const {
  SERVICE_SHOW,
  SERVICE_ADD_ACTION,
  SERVICE_ADD_SCALE,
  SERVICE_ADD_ROLEACTION,
  SERVICE_ADD_ROLE,
  SERVICE_ADD_SCHEDACTION,
  SERVICE_UPDATE_SCHEDACTION,
  SERVICE_DELETE_SCHEDACTION,
  SERVICE_DELETE,
} = ActionsService

const {
  SERVICE_TEMPLATE_SHOW,
  SERVICE_TEMPLATE_ACTION,
  SERVICE_TEMPLATE_CREATE,
  SERVICE_TEMPLATE_UPDATE,
  SERVICE_TEMPLATE_DELETE,
} = ActionsTemplate

const services = [
  {
    ...CommandsService[SERVICE_SHOW],
    action: service,
  },
  {
    ...CommandsService[SERVICE_ADD_ACTION],
    action: serviceAddAction,
  },
  {
    ...CommandsService[SERVICE_ADD_SCALE],
    action: serviceAddScale,
  },
  {
    ...CommandsService[SERVICE_ADD_ROLE],
    action: serviceAddRole,
  },
  {
    ...CommandsService[SERVICE_ADD_ROLEACTION],
    action: serviceAddRoleAction,
  },
  {
    ...CommandsService[SERVICE_ADD_SCHEDACTION],
    action: serviceAddSchedAction,
  },
  {
    ...CommandsService[SERVICE_UPDATE_SCHEDACTION],
    action: serviceUpdateSchedAction,
  },
  {
    ...CommandsService[SERVICE_DELETE_SCHEDACTION],
    action: serviceDeleteSchedAction,
  },
  {
    ...CommandsService[SERVICE_DELETE],
    action: serviceDelete,
  },
]

const template = [
  {
    ...CommandsTemplate[SERVICE_TEMPLATE_SHOW],
    action: serviceTemplate,
  },
  {
    ...CommandsTemplate[SERVICE_TEMPLATE_ACTION],
    action: serviceTemplateAction,
  },
  {
    ...CommandsTemplate[SERVICE_TEMPLATE_CREATE],
    action: serviceTemplateCreate,
  },
  {
    ...CommandsTemplate[SERVICE_TEMPLATE_UPDATE],
    action: serviceTemplateUpdate,
  },
  {
    ...CommandsTemplate[SERVICE_TEMPLATE_DELETE],
    action: serviceTemplateDelete,
  },
]

module.exports = [...services, ...template]
