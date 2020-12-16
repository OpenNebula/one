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
  from: { resource, postBody, query },
  httpMethod: { GET, POST, PUT, DELETE }
} = require('../defaults');

const TEMPLATE_ALLOCATE = 'template.allocate';
const TEMPLATE_CLONE = 'template.clone';
const TEMPLATE_DELETE = 'template.delete';
const TEMPLATE_INSTANTIATE = 'template.instantiate';
const TEMPLATE_UPDATE = 'template.update';
const TEMPLATE_CHMOD = 'template.chmod';
const TEMPLATE_CHOWN = 'template.chown';
const TEMPLATE_RENAME = 'template.rename';
const TEMPLATE_LOCK = 'template.lock';
const TEMPLATE_UNLOCK = 'template.unlock';
const TEMPLATE_INFO = 'template.info';
const TEMPLATE_POOL_INFO = 'templatepool.info';

const Actions = {
  TEMPLATE_ALLOCATE,
  TEMPLATE_CLONE,
  TEMPLATE_DELETE,
  TEMPLATE_INSTANTIATE,
  TEMPLATE_UPDATE,
  TEMPLATE_CHMOD,
  TEMPLATE_CHOWN,
  TEMPLATE_RENAME,
  TEMPLATE_LOCK,
  TEMPLATE_UNLOCK,
  TEMPLATE_INFO,
  TEMPLATE_POOL_INFO
};

module.exports = {
  Actions,
  Commands: {
    [TEMPLATE_ALLOCATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        template: {
          from: postBody,
          default: ''
        }
      }
    },
    [TEMPLATE_CLONE]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0
        },
        name: {
          from: postBody,
          default: ''
        },
        image: {
          from: postBody,
          default: false
        }
      }
    },
    [TEMPLATE_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0
        },
        image: {
          from: query,
          default: false
        }
      }
    },
    [TEMPLATE_INSTANTIATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        name: {
          from: postBody,
          default: ''
        },
        pending: {
          from: postBody,
          default: false
        },
        template: {
          from: postBody,
          default: ''
        },
        image: {
          from: postBody,
          default: false
        }
      }
    },
    [TEMPLATE_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        template: {
          from: postBody,
          default: ''
        },
        replace: {
          from: postBody,
          default: 0
        }
      }
    },
    [TEMPLATE_CHMOD]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        user_use: {
          from: postBody,
          default: -1
        },
        user_manage: {
          from: postBody,
          default: -1
        },
        user_admin: {
          from: postBody,
          default: -1
        },
        group_use: {
          from: postBody,
          default: -1
        },
        group_manage: {
          from: postBody,
          default: -1
        },
        group_admin: {
          from: postBody,
          default: -1
        },
        other_use: {
          from: postBody,
          default: -1
        },
        other_manage: {
          from: postBody,
          default: -1
        },
        other_admin: {
          from: postBody,
          default: -1
        },
        image: {
          from: postBody,
          default: false
        }
      }
    },
    [TEMPLATE_CHOWN]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        user_id: {
          from: postBody,
          default: -1
        },
        group_id: {
          from: postBody,
          default: -1
        }
      }
    },
    [TEMPLATE_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        name: {
          from: postBody,
          default: ''
        }
      }
    },
    [TEMPLATE_LOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        lock: {
          from: postBody,
          default: 4
        }
      }
    },
    [TEMPLATE_UNLOCK]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [TEMPLATE_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0
        },
        extended: {
          from: query,
          default: false
        },
        decrypt: {
          from: query,
          default: false
        }
      }
    },
    [TEMPLATE_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -1
        },
        start: {
          from: query,
          default: -1
        },
        end: {
          from: query,
          default: -1
        }
      }
    }
  }
};
