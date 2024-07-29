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
  from: { resource, postBody },
  httpMethod: { GET, POST, DELETE },
} = require('../defaults')

const ACL_ADDRULE = 'acl.addrule'
const ACL_DELRULE = 'acl.delrule'
const ACL_INFO = 'acl.info'

const Actions = {
  ACL_ADDRULE,
  ACL_DELRULE,
  ACL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [ACL_ADDRULE]: {
      // inspected
      httpMethod: POST,
      params: {
        user: {
          from: postBody,
          default: '0x100000000',
        },
        resource: {
          from: postBody,
          default: '0x1000000000',
        },
        right: {
          from: postBody,
          default: '0x1',
        },
        zone: {
          from: postBody,
          default: '0x100000000',
        },
      },
    },
    [ACL_DELRULE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [ACL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
  },
}
