/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
const {
  show,
  list,
  upload,
  update,
  deleteFile,
} = require('server/routes/api/files/functions')
const { GET, POST, PUT, DELETE } = httpMethod

const publicRoutes = {
  [GET]: {
    null: {
      action: show,
      params: {
        file: {
          from: fromData.query,
          name: 'file',
        },
        token: {
          from: fromData.query,
          name: 'token',
        },
        app: {
          from: fromData.query,
          name: 'app',
        },
      },
    },
  },
}

const privateRoutes = {
  [GET]: {
    null: {
      action: list,
      params: {
        app: {
          from: fromData.query,
          name: 'app',
        },
      },
    },
  },
  [POST]: {
    null: {
      action: upload,
      params: {
        app: {
          from: fromData.query,
          name: 'app',
        },
        files: {
          from: 'files',
          name: 'files',
        },
        root: {
          from: fromData.query,
          name: 'public',
        },
      },
    },
  },
  [PUT]: {
    null: {
      action: update,
      params: {
        name: {
          from: fromData.query,
          name: 'name',
        },
        files: {
          from: 'files',
          name: 'files',
        },
      },
    },
  },
  [DELETE]: {
    null: {
      action: deleteFile,
      params: {
        file: {
          from: fromData.query,
          name: 'file',
        },
      },
    },
  },
}

const fileApi = {
  publicRoutes,
  privateRoutes,
}
module.exports = fileApi
