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

const { GET, POST, DELETE, PUT } = httpMethod;

const privateRoutes = {
  'service-all': {
    httpMethod: GET,
    action: serviceAll
  },
  service: {
    httpMethod: GET,
    action: service
  },
  'service-delete': {
    httpMethod: DELETE,
    action: serviceDelete
  },
  'service-add-action': {
    httpMethod: POST,
    action: serviceAddAction
  },
  'service-add-scale': {
    httpMethod: POST,
    action: serviceAddScale
  },
  'service-add-role-action': {
    httpMethod: POST,
    action: serviceAddRoleAction
  },
  'service_template-all': {
    httpMethod: GET,
    action: serviceTemplateAll
  },
  service_template: {
    httpMethod: GET,
    action: serviceTemplate
  },
  'service_template-delete': {
    httpMethod: DELETE,
    action: serviceTemplateDelete
  },
  'service_template-create': {
    httpMethod: POST,
    action: serviceTemplateCreate
  },
  'service_template-update': {
    httpMethod: PUT,
    action: serviceTemplateUpdate
  },
  'service_template-action': {
    httpMethod: POST,
    action: serviceTemplateAction
  }
};

const publicRoutes = {};

const functionRoutes = {
  private: privateRoutes,
  public: publicRoutes
};

module.exports = functionRoutes;
