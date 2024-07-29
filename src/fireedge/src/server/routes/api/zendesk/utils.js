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
const { global } = require('window-or-global')

/**
 * Get data fireedge session.
 *
 * @param {string} username - username
 * @param {string} token - pass
 * @returns {object} user session
 */
const getSession = (username = '', token = '') => {
  if (
    username &&
    token &&
    global &&
    global.users &&
    username &&
    global.users[username] &&
    global.users[username].tokens
  ) {
    return global.users[username].tokens.find(
      (curr = {}, index = 0) => curr.token === token
    )
  }
}

const functions = {
  getSession,
}

module.exports = functions
