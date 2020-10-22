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
const socketIO = require('socket.io')
const { socket: socketZeroMQ } = require('zeromq')
const xml2js = require('xml2js')

const { messageTerminal } = require('server/utils/general')
const { validateAuth } = require('server/utils/jwt')
const { defaultOpennebulaZones } = require('server/utils/constants/defaults')

// user config

const endpoint = '/zeromq'
const oneHooksEmits = appServer => {
  let address = ''
  try {
    appServer
      .use((socketServer, next) => {
        if (
          socketServer.handshake.query &&
          socketServer.handshake.query.token &&
          validateAuth({
            headers: { authorization: socketServer.handshake.query.token }
          })
        ) {
          const configuredZones = global &&
            global.zones &&
            Array.isArray(global.zones)
            ? global.zones
            : defaultOpennebulaZones
          const zone = socketServer.handshake.query.zone || '0'
          const dataZone = configuredZones.find(
            ({ ID, ZEROMQ }) => ID === zone && ZEROMQ
          )
          if (dataZone && dataZone.ZEROMQ) {
            address = dataZone.ZEROMQ
            next()
          } else {
            socketServer.disconnect(true)
          }
        } else {
          socketServer.disconnect(true)
        }
      })
      .on('connection', socketServer => {
        const zeromqSock = socketZeroMQ('sub')
        console.log('dasdasd', address)
        zeromqSock.connect(address)
        zeromqSock.subscribe('')

        socketServer.on('disconnect', function () {
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
                  socketServer.emit('zeroMQ', {
                    command: mssgs[0],
                    data: result
                  })
                }
              }
            )
          }
        })
      })
  } catch (error) {
    const configErrorZeroMQ = {
      color: 'red',
      type: error,
      message: '%s'
    }
    messageTerminal(configErrorZeroMQ)
  }
}

const oneHooks = appServer => {
  if (
    appServer &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    const io = socketIO({ path: endpoint }).listen(appServer)
    oneHooksEmits(io)
  }
}

module.exports = {
  endpoint,
  oneHooks
}
