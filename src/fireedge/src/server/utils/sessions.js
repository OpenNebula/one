/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

/**
 * Ensures user and token index exists.
 */
const ensureSessionStore = () => {
  global.sessionStore ??= {}
  global.tokenIndex ??= {}
}

/**
 * @param {string} user - Name of user storing session
 * @param {object} tokenData - Params
 * @param {string} tokenData.token - JWT
 * @param {number} tokenData.expires - Token expiration timestamp
 */
const addUserSession = (user, { token, expires }) => {
  ensureSessionStore()
  global.sessionStore[user] ??= { tokens: [] }

  const pos =
    global.sessionStore[user].tokens.push({
      token,
      expires,
    }) - 1

  global.tokenIndex[token] = { user, pos }
}

/**
 * @param {string} token - Parsed cookie stored JWT
 */
const removeUserSession = (token) => {
  ensureSessionStore()

  const index = global.tokenIndex[token]
  if (!index) return

  const { user, pos } = index

  const tokens = global.sessionStore[user]?.tokens
  if (!tokens) return

  tokens.splice(pos, 1)
  if (tokens.length === 0) delete global.sessionStore[user]

  delete global.tokenIndex[token]
}

module.exports = {
  ensureSessionStore,
  addUserSession,
  removeUserSession,
}
