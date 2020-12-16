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

const MARKET_ALLOCATE = 'market.allocate';
const MARKET_DELETE = 'market.delete';
const MARKET_UPDATE = 'market.update';
const MARKET_CHMOD = 'market.chmod';
const MARKET_CHOWN = 'market.chown';
const MARKET_RENAME = 'market.rename';
const MARKET_INFO = 'market.info';
const MARKET_POOL_INFO = 'marketpool.info';

const Actions = {
  MARKET_ALLOCATE,
  MARKET_DELETE,
  MARKET_UPDATE,
  MARKET_CHMOD,
  MARKET_CHOWN,
  MARKET_RENAME,
  MARKET_INFO,
  MARKET_POOL_INFO
};

module.exports = {
  Actions,
  Commands: {
    [MARKET_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: ''
        }
      }
    },
    [MARKET_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0
        }
      }
    },
    [MARKET_UPDATE]: {
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
        update: {
          from: postBody,
          default: 0
        }
      }
    },
    [MARKET_CHMOD]: {
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
    [MARKET_CHOWN]: {
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
    [MARKET_RENAME]: {
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
    [MARKET_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: -1
        },
        decrypt: {
          from: query,
          default: false
        }
      }
    },
    [MARKET_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {}
    }
  }
};
