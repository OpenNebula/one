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
} = require('../defaults');

const VMGROUP_ALLOCATE = 'vmgroup.allocate';
const VMGROUP_DELETE = 'vmgroup.delete';
const VMGROUP_UPDATE = 'vmgroup.update';
const VMGROUP_CHMOD = 'vmgroup.chmod';
const VMGROUP_CHOWN = 'vmgroup.chown';
const VMGROUP_RENAME = 'vmgroup.rename';
const VMGROUP_INFO = 'vmgroup.info';
const VMGROUP_LOCK = 'vmgroup.lock';
const VMGROUP_UNLOCK = 'vmgroup.unlock';
const VMGROUP_POOL_INFO = 'vmgrouppool.info';

const Actions = {
  VMGROUP_ALLOCATE,
  VMGROUP_DELETE,
  VMGROUP_UPDATE,
  VMGROUP_CHMOD,
  VMGROUP_CHOWN,
  VMGROUP_RENAME,
  VMGROUP_INFO,
  VMGROUP_LOCK,
  VMGROUP_UNLOCK,
  VMGROUP_POOL_INFO
};

module.exports = {
  Actions,
  Commands: {
    [VMGROUP_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: ''
        }
      }
    },
    [VMGROUP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [VMGROUP_UPDATE]: {
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
    [VMGROUP_CHMOD]: {
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
    [VMGROUP_CHOWN]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        user: {
          from: postBody,
          default: -1
        },
        group: {
          from: postBody,
          default: -1
        }
      }
    },
    [VMGROUP_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        },
        name: {
          from: postBody,
          defaul: ''
        }
      }
    },
    [VMGROUP_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0
        },
        decrypt: {
          from: postBody,
          default: false
        }
      }
    },
    [VMGROUP_LOCK]: {
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
    [VMGROUP_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [VMGROUP_POOL_INFO]: {
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
