/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

const { getFireedgeConfig } = require('server/utils/yml')
const { opennebulaConnect } = require('server/utils/opennebula')
const { defaults } = require('server/utils/constants')
const {
  verifyUserExists,
  resolveTFAResponse,
  AUTH_TYPES,
  TFAResult,
} = require('server/routes/api/auth/utils')

const {
  defaultHeaderRemote,
  defaultHeaderx509,
  defaultJwtCookieName,
  defaultSessionExpiration,
  defaultOpennebulaZones,
} = defaults

const REMOTE_PROTOCOL_MAP = {
  remote: AUTH_TYPES.REMOTE,
  x509: AUTH_TYPES.x509,
}

/**
 * Attempt reverse-proxy header authentication for remote/x509 auth types.
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const tryRemoteAuth = async (req, res) => {
  const appConfig = getFireedgeConfig()
  const protocol = REMOTE_PROTOCOL_MAP?.[appConfig?.auth]

  if (!protocol) return
  if (req.cookies?.[defaultJwtCookieName]) return

  const headerNames =
    appConfig.auth === 'x509' ? defaultHeaderx509 : defaultHeaderRemote

  const foundHeader = Object.keys(req.headers).find((h) =>
    headerNames.includes(h)
  )
  if (!foundHeader) return

  const user = req.get(foundHeader)
  if (!user) return

  const rpc = global.zones?.[0]?.rpc ?? defaultOpennebulaZones[0].rpc
  const connect = (u, p) => opennebulaConnect(u, p, rpc)

  const verifiedUser = await verifyUserExists({
    user,
    token: user,
    connect,
    protocol,
  })

  const response = await resolveTFAResponse(TFAResult.OK, verifiedUser, {
    connect,
  })

  if (response?.session) {
    const { token, expiration } = response.session
    const maxAge = expiration
      ? expiration * 1000 - Date.now()
      : defaultSessionExpiration * 60 * 1000

    res.cookie(defaultJwtCookieName, JSON.stringify({ token }), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge,
    })
  }
}

module.exports = { tryRemoteAuth }
