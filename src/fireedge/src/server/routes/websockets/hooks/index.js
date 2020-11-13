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

const atob = require('atob')
const { socket: socketZeroMQ } = require('zeromq')
const xml2js = require('xml2js')
const { messageTerminal } = require('server/utils/general')
const { authWebsocket, getDataZone } = require('server/utils/server')
const type = 'hooks'
const main = (app = {}) => {
  try {
    app
      .use(authWebsocket)
      .on('connection', (server = {}) => {
        if (
          server &&
          server.handshake &&
          server.handshake.query &&
          server.handshake.query.zone
        ) {
          const queryZone = server.handshake.query.zone
          const zone = queryZone && queryZone !== 'undefined' ? queryZone : '0'
          const dataZone = getDataZone(zone)
          if (dataZone && dataZone.ZEROMQ) {
            const zeromqSock = socketZeroMQ('sub')
            zeromqSock.connect(dataZone.ZEROMQ)
            zeromqSock.subscribe('')
            server.on('disconnect', function () {
              zeromqSock.close()
            })
            zeromqSock.on('message', (...args) => {
              const mssgs = []
              Array.prototype.slice.call(args).forEach(arg => {
                mssgs.push(arg.toString())
              })
              if (mssgs[0] && mssgs[1]) {
                xml2js.parseString(
                  atob(mssgs[1]),
                  {
                    explicitArray: false,
                    trim: true,
                    normalize: true,
                    includeWhiteChars: true,
                    strict: false
                  },
                  (error, result) => {
                    if (error) {
                      const configErrorParser = {
                        color: 'red',
                        type: error,
                        message: 'Error parser: %s'
                      }
                      messageTerminal(configErrorParser)
                    } else {
                      app.emit(type, {
                        command: mssgs[0],
                        data: result
                      })
                    }
                  }
                )
              }
            })
          }
        }
      })
  } catch (error) {
    const configErrorHooks = {
      color: 'red',
      type: error,
      message: '%s'
    }
    messageTerminal(configErrorHooks)
  }
}

module.exports = {
  main
}
