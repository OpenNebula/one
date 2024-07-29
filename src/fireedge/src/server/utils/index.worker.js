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

const { opennebulaConnect } = require('../../../src/server/utils/opennebula')

// eslint-disable-next-line no-undef
onmessage = function (ev = {}) {
  const { data } = ev
  let pass = true

  /**
   * Return data worker.
   *
   * @param {any} rtnData - data for worker
   */
  const returnDataWorker = (rtnData = '') => {
    if (pass) {
      // eslint-disable-next-line no-undef
      postMessage(rtnData)
    }
  }

  /**
   * Function when the worker is XMLRPC.
   *
   * @param {object} config - config XMLRPC
   */
  const xmlrpc = (config = {}) => {
    const {
      globalState = {},
      user = '',
      password = '',
      rpc = '',
      command = '',
      paramsCommand = [],
    } = config
    if (globalState && user && password && rpc && command) {
      pass = false
      global.paths = globalState
      const oneConnect = opennebulaConnect(user, password, rpc)
      oneConnect({
        action: command,
        parameters: paramsCommand,
        callback: (err, value) => {
          pass = true
          returnDataWorker({ err, value })
        },
      })
    }
  }

  if (data) {
    const { type = '', config = '' } = data
    type === 'xmlrpc' && xmlrpc(config)
  }
  returnDataWorker()
}
