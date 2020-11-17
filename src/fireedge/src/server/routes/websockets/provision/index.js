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

const { authWebsocket } = require('server/utils/server')
const { messageTerminal } = require('server/utils/general')
const { subscriber } = require('server/routes/api/provision/functions')
const type = 'provision'
const main = (app = {}) => {
  try {
    app
      .use(authWebsocket)
      .on('connection', (server = {}) => {
        server.on('disconnect', () => { console.log('disconnect') })
        subscriber(
          'oneprovision',
          data => {
            app.emit(type, {
              id: data.id,
              data: data.message
            })
          }
        )
      })
  } catch (error) {
    const configErrorProvision = {
      color: 'red',
      type: error,
      message: '%s'
    }
    messageTerminal(configErrorProvision)
  }
}

module.exports = {
  main
}
