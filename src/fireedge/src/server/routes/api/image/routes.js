/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

const { httpMethod, from } = require('../../../utils/constants/defaults')

const { POST } = httpMethod
const { postBody } = from

const basepath = '/image'
const IMAGE_UPLOAD = 'image.upload'
const IMAGE_CLEANUP = 'image.cleanup'

const Actions = {
  IMAGE_UPLOAD,
  IMAGE_CLEANUP,
}

module.exports = {
  Actions,
  Commands: {
    [IMAGE_UPLOAD]: {
      path: `${basepath}/upload`,
      httpMethod: POST,
      auth: true,
      params: {
        files: {
          from: 'files',
        },
      },
    },
    [IMAGE_CLEANUP]: {
      path: `${basepath}/cleanup`,
      httpMethod: POST,
      auth: true,
      params: {
        path: {
          from: postBody,
        },
      },
    },
  },
}
