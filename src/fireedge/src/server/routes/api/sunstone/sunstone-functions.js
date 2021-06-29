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

// const { httpMethod } = require('server/utils/constants/defaults')
// const { httpResponse, parsePostData } = require('server/utils/server')
/* const {
  internalServerError
} = require('server/utils/constants/http-codes') */

const sunstone = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  console.log('aca se tienen que obtener los YAMLS', global)
}

const sunstoneApi = {
  sunstone
}
module.exports = sunstoneApi
