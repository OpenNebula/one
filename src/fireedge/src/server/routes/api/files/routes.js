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
  from: fromData,
  httpMethod,
} = require('server/utils/constants/defaults')

const { GET, POST, PUT, DELETE } = httpMethod
const basepath = '/files'
const { query } = fromData

const FILE_SHOW = 'file.show'
const FILE_LIST = 'file.list'
const FILE_UPLOAD = 'file.upload'
const FILE_UPDATE = 'file.update'
const FILE_DELETE = 'file.delete'

const Actions = {
  FILE_SHOW,
  FILE_LIST,
  FILE_UPLOAD,
  FILE_UPDATE,
  FILE_DELETE,
}

module.exports = {
  Actions,
  Commands: {
    [FILE_SHOW]: {
      path: `${basepath}/show`,
      httpMethod: GET,
      auth: false,
      params: {
        file: {
          from: query,
        },
        token: {
          from: query,
        },
        app: {
          from: query,
        },
      },
    },
    [FILE_LIST]: {
      path: `${basepath}`,
      httpMethod: GET,
      auth: true,
      params: {
        app: {
          from: query,
        },
      },
    },
    [FILE_UPLOAD]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        app: {
          from: query,
        },
        files: {
          from: 'files',
        },
        public: {
          from: query,
        },
      },
    },
    [FILE_UPDATE]: {
      path: `${basepath}`,
      httpMethod: PUT,
      auth: true,
      params: {
        name: {
          from: query,
        },
        files: {
          from: 'files',
        },
      },
    },
    [FILE_DELETE]: {
      path: `${basepath}`,
      httpMethod: DELETE,
      auth: true,
      params: {
        file: {
          from: query,
        },
      },
    },
  },
}
