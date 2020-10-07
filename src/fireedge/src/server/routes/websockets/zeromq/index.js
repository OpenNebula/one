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

const atob = require('atob');
const socketIO = require('socket.io');
const { socket: socketZeroMQ } = require('zeromq');
const xml2js = require('xml2js');

const { messageTerminal } = require('server/utils/general');
const { getConfig } = require('server/utils/yml');
const { validateAuth } = require('server/utils/jwt');

// user config
const appConfig = getConfig();

const zeromqType = appConfig.ZEROTYPE || 'tcp';
const zeromqPort = appConfig.ZEROPORT || 2101;
const zeromqHost = appConfig.ZEROHOST || '127.0.0.1';

const endpoint = '/zeromq';
const oneHooksEmits = appServer => {
  // connect to zeromq
  const zeromqSock = socketZeroMQ('sub');
  const address = `${zeromqType}://${zeromqHost}:${zeromqPort}`;
  try {
    zeromqSock.connect(address);
    zeromqSock.subscribe('');

    appServer
      .use((socketServer, next) => {
        if (
          socketServer.handshake.query &&
          socketServer.handshake.query.token &&
          validateAuth({
            headers: { authorization: socketServer.handshake.query.token }
          })
        ) {
          next();
        } else {
          next(new Error('Authentication error'));
        }
      })
      .on('connection', socketServer => {
        zeromqSock.on('message', (...args) => {
          const mssgs = [];
          Array.prototype.slice.call(args).forEach(arg => {
            mssgs.push(arg.toString());
          });
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
                  };
                  messageTerminal(configErrorParser);
                } else {
                  socketServer.emit('zeroMQ', {
                    command: mssgs[0],
                    data: result
                  });
                }
              }
            );
          }
        });
      });
  } catch (error) {
    const configErrorZeroMQ = {
      color: 'red',
      type: error,
      message: '%s'
    };
    messageTerminal(configErrorZeroMQ);
  }
};

const oneHooks = appServer => {
  if (
    appServer &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    const io = socketIO({ path: endpoint }).listen(appServer);
    oneHooksEmits(io);
  }
};

module.exports = {
  endpoint,
  oneHooks
};
