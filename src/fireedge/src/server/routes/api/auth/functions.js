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
const { jwtDecode } = require('server/utils/jwt')
const { XMLParser } = require('fast-xml-parser')
const { httpResponse } = require('server/utils/server')
const {
  ensureSessionStore,
  removeUserSession,
} = require('server/utils/sessions')

const {
  AUTH_TYPES,
  verifyUserExists,
  resolveTFAResponse,
  check2FA,
  setZones,
} = require('server/routes/api/auth/utils')

const { defaults, httpCodes } = require('server/utils/constants')
const { getFireedgeConfig } = require('server/utils/yml')

const { writeInLogger } = require('server/utils/logger')
const atob = require('atob')

const { internalServerError, unauthorized, ok } = httpCodes

const {
  defaultConfigParseXML,
  defaultJwtCookieName,
  defaultSessionExpiration,
} = defaults

const login = async ({ protocol, next, params, connect }) => {
  const verifiedUser = await verifyUserExists({
    user: params.user,
    token: params.token,
    connect,
    protocol,
  })

  setZones({ connect: connect(params.user, params.token), next })

  const TFA_STATUS = await check2FA(verifiedUser, {
    tfatoken: params.tfatoken,
    connect,
    protocol,
  })

  const response = await resolveTFAResponse(TFA_STATUS, verifiedUser, {
    connect,
  })

  if (!response) throw httpResponse(internalServerError)

  return response
}

/**
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} _params - params of http request
 * @param {object} _userData - user of http request
 * @param {Function} _connect - function of xmlrpc
 * @param {object} req - express router request handler
 * @returns {object} HttpResponse
 */
const logout = async (res, next, _params, _userData, _connect, req) => {
  ensureSessionStore()
  const { [defaultJwtCookieName]: sessionCookie } = req.cookies ?? {}
  if (sessionCookie) {
    try {
      const { token: jwt } = JSON.parse(sessionCookie)
      if (jwt) {
        const { jti: token } = jwtDecode(jwt)
        removeUserSession(token)
      }
    } catch {}

    res.clearCookie(defaultJwtCookieName, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
  }
  res.locals.httpCode = httpResponse(ok, 'Logout successful')
  next()
}

/**
 * Fireedge user auth.
 *
 * @param {string} protocol - Auth type
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} _userData - user of http request
 * @param {Function} connect - function of xmlrpc
 * @returns {object} HttpResponse containing user session
 */
const auth = async (
  { protocol = AUTH_TYPES.CORE },
  res,
  next,
  params,
  _userData,
  connect
) => {
  try {
    const response = await login({ protocol, next, params, connect })

    if (!response) throw httpResponse(internalServerError)
    const { httpCode, payload, session } = response

    if (session) {
      const { token, expiration } = session
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

    res.locals.httpCode = httpResponse(httpCode, payload)
  } catch (error) {
    if (Object.values(httpCodes).find(({ id }) => id === error?.id)) {
      res.locals.httpCode = error
    } else {
      res.locals.httpCode = httpResponse(internalServerError)
    }
  } finally {
    next()
  }
}

const getBasePath = (req = {}) => {
  const originalUrl = req?.originalUrl || ''
  const idx = originalUrl.indexOf('/api')

  return idx > 0 ? originalUrl.substring(0, idx) : '/'
}

/**
 * Saml authentication. for POST endpoint.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} _userData - user of http request
 * @param {Function} connect - function of xmlrpc
 * @param {object} req - http request
 */
const samlAuth = async (
  res = {},
  next,
  params = {},
  _userData,
  connect,
  req = {}
) => {
  const basepath = getBasePath(req)
  const { SAMLResponse } = params

  try {
    if (!SAMLResponse)
      throw httpResponse(
        unauthorized,
        '',
        'The SAMLResponse parameter is missing.'
      )

    const xmlMessage = atob(SAMLResponse)
    const parser = new XMLParser(defaultConfigParseXML)
    const data = parser.parse(xmlMessage)

    const user = data?.Response?.Assertion?.Subject?.NameID?.['#text']

    if (!user) {
      throw httpResponse(unauthorized, '', 'SAML user not found in response.')
    }

    const response = await login({
      protocol: AUTH_TYPES.SAML,
      next,
      params: { user, token: SAMLResponse },
      connect,
    })

    if (!response) throw httpResponse(internalServerError)

    const { httpCode, payload, session } = response

    if (session) {
      const { token, expiration } = session
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

    res.locals.httpCode = httpResponse(httpCode, payload)
  } catch (err) {
    writeInLogger(err, { format: 'SAML authentication error: %s' })
  } finally {
    res.redirect(basepath)
  }
}
/**
 * Fireedge select type auth.
 * (This is because the authentication methods have to be extended after that).
 *
 * @param {...any} args - Auth params
 * @returns {Function} - auth function
 */
const selectTypeAuth = async (...args) => {
  const authProtocols = {
    remote: () => auth({ protocol: AUTH_TYPES.REMOTE }, ...args),
    x509: () => auth({ protocol: AUTH_TYPES.x509 }, ...args),
    opennebula: () => auth({ protocol: AUTH_TYPES.CORE }, ...args),
  }

  const selected = getFireedgeConfig()?.auth ?? 'opennebula'

  return await authProtocols[selected]()
}

module.exports = {
  selectTypeAuth,
  samlAuth,
  logout,
}
