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

const socketIO = require('socket.io')
const { messageTerminal } = require('server/utils/general')
const {
  defaultFilesWebsockets,
  defaultConfigErrorMessage,
  defaultEndpointWebsocket
} = require('server/utils/constants/defaults')

// user config

const websockets = (appServer = {}) => {
  if (
    appServer &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    const io = socketIO({ path: defaultEndpointWebsocket }).listen(appServer)
    defaultFilesWebsockets.map(file => {
      try {
        // eslint-disable-next-line global-require
        const fileInfo = require(`./${file}`)
        if (fileInfo.main && typeof fileInfo.main === 'function') {
          fileInfo.main(io)
        }
      } catch (error) {
        if (error instanceof Error && error.code === 'MODULE_NOT_FOUND') {
          const config = defaultConfigErrorMessage
          config.type = error.message
          messageTerminal(config)
        }
      }
    })
  }
}

module.exports = {
  websockets
}
