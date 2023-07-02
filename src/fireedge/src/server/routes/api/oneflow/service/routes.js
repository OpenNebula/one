/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
  httpMethod,
  from: fromData,
} = require('../../../../utils/constants/defaults')

const { GET, POST, DELETE, PUT } = httpMethod
const { resource, postBody } = fromData
const basepath = '/service'

const SERVICE_SHOW = 'service.show'
const SERVICE_ADD_ACTION = 'service.addaction'
const SERVICE_ADD_SCALE = 'service.addscale'
const SERVICE_ADD_ROLEACTION = 'service.addroleaction'
const SERVICE_ADD_SCHEDACTION = 'service.addscheaction'
const SERVICE_UPDATE_SCHEDACTION = 'service.updateschedaction'
const SERVICE_DELETE_SCHEDACTION = 'service.deleteschedaction'
const SERVICE_DELETE = 'service.delete'

const Actions = {
  SERVICE_SHOW,
  SERVICE_ADD_ACTION,
  SERVICE_ADD_SCALE,
  SERVICE_ADD_ROLEACTION,
  SERVICE_ADD_SCHEDACTION,
  SERVICE_UPDATE_SCHEDACTION,
  SERVICE_DELETE_SCHEDACTION,
  SERVICE_DELETE,
}

module.exports = {
  Actions,
  Commands: {
    [SERVICE_SHOW]: {
      path: `${basepath}/:id?`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [SERVICE_ADD_ACTION]: {
      path: `${basepath}/action/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        action: {
          from: postBody,
        },
      },
    },
    [SERVICE_ADD_SCALE]: {
      path: `${basepath}/scale/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        action: {
          from: postBody,
        },
      },
    },
    [SERVICE_ADD_ROLEACTION]: {
      path: `${basepath}/role_action/:id/:role`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        role: {
          from: resource,
        },
        action: {
          from: postBody,
        },
      },
    },
    [SERVICE_ADD_SCHEDACTION]: {
      path: `${basepath}/sched_action/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        sched_action: {
          from: postBody,
        },
      },
    },
    [SERVICE_UPDATE_SCHEDACTION]: {
      path: `${basepath}/sched_action/:id/:id_sched`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        id_sched: {
          from: resource,
        },
        sched_action: {
          from: postBody,
        },
      },
    },
    [SERVICE_DELETE_SCHEDACTION]: {
      path: `${basepath}/sched_action/:id/:id_sched`,
      httpMethod: DELETE,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        id_sched: {
          from: resource,
        },
      },
    },
    [SERVICE_DELETE]: {
      path: `${basepath}/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
  },
}
