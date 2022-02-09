/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
  let pass = true

  const returnData = (data = '') => {
    if (pass) {
      // eslint-disable-next-line no-undef
      postMessage(data)
    }
  }

  if (ev && ev.data) {
    const {
      globalState = {},
      user = '',
      password = '',
      rpc = '',
      command = '',
      paramsCommand = [],
    } = ev.data
    if (globalState && user && password && rpc && command) {
      pass = false
      global.paths = globalState
      const connect = opennebulaConnect(user, password, rpc)
      connect(command, paramsCommand, (err, value) => {
        pass = true
        returnData({ err, value })
      })
    }
  }
  returnData()
}
