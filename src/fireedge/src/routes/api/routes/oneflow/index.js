/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */
const {
  serviceAll,
  service,
  serviceDelete,
  serviceAddAction,
  serviceAddScale,
  serviceAddRoleAction
} = require('./service');
const {
  serviceTemplateAll,
  serviceTemplate,
  serviceTemplateDelete,
  serviceTemplateCreate,
  serviceTemplateUpdate,
  serviceTemplateAction
} = require('./service_template');
const { httpMethod } = require('../../../../utils/constants/defaults');
const {
  SERVICE_ALL,
  SERVICE,
  SERVICE_DELETE,
  SERVICE_ADD_ACTION,
  SERVICE_ADD_SCALE,
  SERVICE_ADD_ROLE_ACTION,
  SERVICE_TEMPLATE_ALL,
  SERVICE_TEMPLATE,
  SERVICE_TEMPLATE_DELETE,
  SERVICE_TEMPLATE_CREATE,
  SERVICE_TEMPLATE_UPDATE,
  SERVICE_TEMPLATE_ACTION
} = require('./string-routes');

const { GET, POST, DELETE, PUT } = httpMethod;

const privateRoutes = [
  {
    httpMethod: GET,
    endpoint: SERVICE_ALL,
    action: serviceAll
  },
  {
    httpMethod: GET,
    endpoint: SERVICE,
    action: service
  },
  {
    httpMethod: DELETE,
    endpoint: SERVICE_DELETE,
    action: serviceDelete
  },
  {
    httpMethod: POST,
    endpoint: SERVICE_ADD_ACTION,
    action: serviceAddAction
  },
  {
    httpMethod: POST,
    endpoint: SERVICE_ADD_SCALE,
    action: serviceAddScale
  },
  {
    httpMethod: POST,
    endpoint: SERVICE_ADD_ROLE_ACTION,
    action: serviceAddRoleAction
  },
  {
    httpMethod: GET,
    endpoint: SERVICE_TEMPLATE_ALL,
    action: serviceTemplateAll
  },
  {
    httpMethod: GET,
    endpoint: SERVICE_TEMPLATE,
    action: serviceTemplate
  },
  {
    httpMethod: DELETE,
    endpoint: SERVICE_TEMPLATE_DELETE,
    action: serviceTemplateDelete
  },
  {
    httpMethod: POST,
    endpoint: SERVICE_TEMPLATE_CREATE,
    action: serviceTemplateCreate
  },
  {
    httpMethod: PUT,
    endpoint: SERVICE_TEMPLATE_UPDATE,
    action: serviceTemplateUpdate
  },
  {
    httpMethod: POST,
    endpoint: SERVICE_TEMPLATE_ACTION,
    action: serviceTemplateAction
  }
];

const publicRoutes = [];

const functionRoutes = {
  private: privateRoutes,
  public: publicRoutes
};

module.exports = functionRoutes;
