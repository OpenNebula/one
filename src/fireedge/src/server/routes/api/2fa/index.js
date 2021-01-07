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

const { generateQR, twoFactorSetup, twoFactorDelete } = require('./functions')
const { httpMethod } = require('server/utils/constants/defaults') // ../../../utils/constants/defaults'
const {
  TWO_FACTOR_QR,
  TWO_FACTOR_DELETE,
  TWO_FACTOR_SETUP
} = require('./string-routes')

const { POST, DELETE } = httpMethod

const privateRoutes = [
  {
    httpMethod: POST,
    endpoint: TWO_FACTOR_QR,
    action: generateQR
  },
  {
    httpMethod: POST,
    endpoint: TWO_FACTOR_SETUP,
    action: twoFactorSetup
  },
  {
    httpMethod: DELETE,
    endpoint: TWO_FACTOR_DELETE,
    action: twoFactorDelete
  }
]

const publicRoutes = []

const functionRoutes = {
  private: privateRoutes,
  public: publicRoutes
}

module.exports = functionRoutes
