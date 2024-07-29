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

const httpCodes = {
  badRequest: {
    id: 400,
    message: 'Bad Request',
  },
  unauthorized: {
    id: 401,
    message: 'Unauthorized',
  },
  notFound: {
    id: 404,
    message: 'Not Found',
  },
  methodNotAllowed: {
    id: 405,
    message: 'Method not Allowed',
  },
  internalServerError: {
    id: 500,
    message: 'Internal Server Error',
  },
  serviceUnavailable: {
    id: 503,
    message: 'Service Unavailable',
  },
  noContent: {
    id: 204,
    message: 'No content',
  },
  accepted: {
    id: 202,
    message: 'Accepted',
  },
  ok: {
    id: 200,
    message: 'OK',
  },
}

module.exports = httpCodes
