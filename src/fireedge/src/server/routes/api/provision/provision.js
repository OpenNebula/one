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
const { httpMethod, from: fromData } = require('server/utils/constants/defaults')
const { getParamsForObject } = require('server/utils/server')
const {
  getList,
  getListProvisions,
  deleteResource,
  deleteProvision,
  hostCommand,
  hostCommandSSH,
  createProvision,
  configureProvision,
  configureHost,
  validate
} = require('./provision-functions')
const { GET, POST, DELETE, PUT } = httpMethod

const routes = {
  [GET]: {
    list: {
      action: getListProvisions,
      params: {
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    cluster: {
      action: getList,
      params: {
        resource: { from: fromData.resource, name: 'method' }
      }
    },
    datastore: {
      action: getList,
      params: {
        resource: { from: fromData.resource, name: 'method' }
      }
    },
    host: {
      action: getList,
      params: {
        resource: { from: fromData.resource, name: 'method' }
      }
    },
    image: {
      action: getList,
      params: {
        resource: { from: fromData.resource, name: 'method' }
      }
    },
    network: {
      action: getList,
      params: {
        resource: { from: fromData.resource, name: 'method' }
      }
    },
    template: {
      action: getList,
      params: {
        resource: { from: fromData.resource, name: 'method' }
      }
    },
    vntemplate: {
      action: getList,
      params: {
        resource: { from: fromData.resource, name: 'method' }
      }
    }
  },
  [POST]: {
    create: { // create <config> --debug // este puede tardar Websocket //FALTA
      action: createProvision, // el comando tiene que ser asincrono
      params: {
        resource: { from: fromData.resource, name: 'method' }
      },
      websocket: true
    },
    validate: {
      action: validate,
      params: {
        resource: { from: fromData.postBody, front: true }
      }
    },
    host: {
      poweroff: {
        action: hostCommand,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2', front: true }
        }
      },
      reboot: {
        action: hostCommand,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2', front: true }
        }
      },
      resume: {
        action: hostCommand,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2', front: true }
        }
      },
      ssh: {
        action: hostCommandSSH,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2', front: true },
          command: { from: fromData.postBody, name: 'command', front: true }
        }
      }
    }
  },
  [DELETE]: {
    delete: { // este puede tardar Websocket  //FALTA
      action: deleteProvision, // el comando tiene que ser asincrono
      params: {
        id: { from: fromData.resource, name: 'id', front: true }
      },
      websocket: true
    },
    datastore: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    flowtemplate: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    host: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    image: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    network: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    vntemplate: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    template: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    },
    cluster: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    }
  },
  [PUT]: {
    configure: { // configure <provisionid>    //--debug, --fail_cleanup, --batch  // este puede tardar Websocket  //FALTA
      action: configureProvision, // el comando tiene que ser asincrono
      params: {
        resource: { from: fromData.resource, name: 'method' }
      },
      websocket: true
    },
    host: {
      action: configureHost,
      params: {
        id: { from: fromData.resource, name: 'id' }
      }
    }
  }
}

const main = (req = {}, res = {}, next = () => undefined, routes = {}, user = {}, index = 0) => {
  const resources = Object.keys(req[fromData.resource])
  if (req && res && next && routes) {
    const route = routes[`${req[fromData.resource][resources[index]]}`.toLowerCase()]
    if (req && fromData && fromData.resource && req[fromData.resource] && route) {
      if (Object.keys(route).length > 0 && route.constructor === Object) {
        if (route.action && route.params && typeof route.action === 'function') {
          const params = getParamsForObject(route.params, req)
          route.action(res, next, params, user)
        } else {
          main(req, res, next, route, user, index + 1)
        }
      } else {
        next()
      }
    } else {
      next()
    }
  } else {
    next()
  }
}

const provisionApi = {
  main,
  routes
}
module.exports = provisionApi
