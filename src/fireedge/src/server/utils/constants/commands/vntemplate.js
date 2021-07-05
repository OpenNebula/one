/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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
} = require('../defaults')

const VNTEMPLATE_ALLOCATE = 'vntemplate.allocate'
const VNTEMPLATE_CLONE = 'vntemplate.clone'
const VNTEMPLATE_DELETE = 'vntemplate.delete'
const VNTEMPLATE_INSTANTIATE = 'vntemplate.instantiate'
const VNTEMPLATE_UPDATE = 'vntemplate.update'
const VNTEMPLATE_CHMOD = 'vntemplate.chmod'
const VNTEMPLATE_CHOWN = 'vntemplate.chown'
const VNTEMPLATE_RENAME = 'vntemplate.rename'
const VNTEMPLATE_INFO = 'vntemplate.info'
const VNTEMPLATE_LOCK = 'vntemplate.lock'
const VNTEMPLATE_UNLOCK = 'vntemplate.unlock'
const VNTEMPLATE_POOL_INFO = 'vntemplatepool.info'

const Actions = {
  VNTEMPLATE_ALLOCATE,
  VNTEMPLATE_CLONE,
  VNTEMPLATE_DELETE,
  VNTEMPLATE_INSTANTIATE,
  VNTEMPLATE_UPDATE,
  VNTEMPLATE_CHMOD,
  VNTEMPLATE_CHOWN,
  VNTEMPLATE_RENAME,
  VNTEMPLATE_INFO,
  VNTEMPLATE_LOCK,
  VNTEMPLATE_UNLOCK,
  VNTEMPLATE_POOL_INFO
}

module.exports = {
  Actions,
  Commands: {
    [VNTEMPLATE_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: ''
        }
      }
    },
    [VNTEMPLATE_CLONE]: {
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
        }
      }
    },
    [VNTEMPLATE_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [VNTEMPLATE_INSTANTIATE]: {
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
        template: {
          from: postBody,
          default: ''
        }
      }
    },
    [VNTEMPLATE_UPDATE]: {
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
    [VNTEMPLATE_CHMOD]: {
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
        }
      }
    },
    [VNTEMPLATE_CHOWN]: {
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
    [VNTEMPLATE_RENAME]: {
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
    [VNTEMPLATE_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0
        },
        decrypt: {
          from: query,
          default: false
        }
      }
    },
    [VNTEMPLATE_LOCK]: {
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
    [VNTEMPLATE_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [VNTEMPLATE_POOL_INFO]: {
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
}
