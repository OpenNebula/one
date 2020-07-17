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

const { server: Server } = require('websocket');
const { socket } = require('zeromq');
const xml2js = require('xml2js');

const { messageTerminal } = require('./general');
const { getConfig } = require('./yml');
const { validateAuth } = require('./jwt');
const { unauthorized } = require('./constants/http-codes');

// user config
const appConfig = getConfig();

const zeromqType = appConfig.ZEROTYPE || 'tcp';
const zeromqPort = appConfig.ZEROPORT || 2101;
const zeromqHost = appConfig.ZEROHOST || '127.0.0.1';

const addWsServer = appServer => {
  if (
    appServer &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    // create the server
    const wsServer = new Server({
      httpServer: appServer
    });

    // connect to zeromq
    const zeromqSock = socket('sub');
    const address = `${zeromqType}://${zeromqHost}:${zeromqPort}`;

    try {
      zeromqSock.connect(address);
      let clients = [];

      wsServer.on('request', request => {
        if (
          request &&
          request.resourceURL &&
          request.resourceURL.query &&
          request.resourceURL.query.token &&
          validateAuth({
            headers: { authorization: request.resourceURL.query.token }
          })
        ) {
          const clientConnection = request.accept(null, request.origin);
          clients.push(clientConnection);
          zeromqSock.subscribe('');
          zeromqSock.on('message', (...args) => {
            const mssgs = [];
            // broadcast
            clients.forEach(client => {
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
                      return;
                    }
                    client.send(
                      JSON.stringify({ command: mssgs[0], data: result })
                    );
                  }
                );
              }
            });
          });
        } else {
          const { id, message } = unauthorized;
          request.reject(id, message);
        }
      });

      wsServer.on('close', request => {
        // clear connection to broadcast
        clients = clients.filter(client => client !== request);
      });
    } catch (error) {
      const configErrorZeroMQ = {
        color: 'red',
        type: error,
        message: '%s'
      };
      messageTerminal(configErrorZeroMQ);
    }
  }
};

module.exports = {
  addWsServer
};
