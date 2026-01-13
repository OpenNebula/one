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
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { Router } = require('express')
const { ServerStyleSheets } = require('@mui/styles')
const { request: axios } = require('axios')
const { writeInLogger } = require('server/utils/logger')
const {
  MissingHeaderError,
  MissingSamlUserInfoError,
} = require('server/utils/errors')

// server
const { getSunstoneConfig, getFireedgeConfig } = require('server/utils/yml')

const { getRemotesConfig } = require('server/utils/remoteModules')
const { getForecastConfig } = require('server/utils/config')

const { getEncodedFavicon } = require('server/utils/logo')
const {
  defaultApps,
  defaultAppName,
  defaultHeaderRemote,
  defaultHeaderx509,
  defaultApiTimeout,
  defaultProtocol,
  defaultIP,
  defaultPort,
  httpMethod,
} = require('server/utils/constants/defaults')
const { global } = require('window-or-global')

const APP_NAMES = Object.keys(defaultApps)
const APP_URL = '/fireedge'
const STATIC_FILES_URL = `${APP_URL}/client/assets`

const upperCaseFirst = (input) =>
  input?.charAt(0)?.toUpperCase() + input.substring(1)

const ensuredScriptValue = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c')

const globalApiTimeout = (config) =>
  /^\d+(?:_\d+)*$/.test(config?.api_timeout)
    ? config.api_timeout
    : defaultApiTimeout

const router = Router()

const defaultConfig = {
  currentTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}
const { POST } = httpMethod

router.get('*', async (req, res) => {
  const APP_CONFIG = {
    [defaultApps.sunstone.name]:
      {
        ...defaultConfig,
        ...getSunstoneConfig({ includeProtectedConfig: false }),
      } || defaultConfig,
  }

  const encodedFavIcon = await getEncodedFavicon()

  const appConfig = getFireedgeConfig()
  const remotesConfig = getRemotesConfig()
  const forecastConfig = getForecastConfig()
  const authType = appConfig?.auth
  const validAuthTypes = ['remote', 'x509']

  const remoteJWT = {
    remoteRedirect: appConfig?.auth_redirect ?? '',
  }
  const samlUser = req?.cookies?.saml_user
  const samlUserData = global?.saml?.[samlUser]
  const validateAuth = validAuthTypes.includes(authType)

  if (validateAuth || samlUserData) {
    let remoteUser = {
      user: samlUser,
      token: samlUserData,
      remember: false,
    }
    let findHeader = false

    if (validateAuth) {
      remoteJWT.remote = true
      const finderHeader = () => {
        const headers = Object.keys(req.headers)
        switch (authType) {
          case validAuthTypes[1]:
            return headers.find((header) => defaultHeaderx509.includes(header))
          default:
            return headers.find((header) =>
              defaultHeaderRemote.includes(header)
            )
        }
      }
      findHeader = finderHeader()
      remoteUser = findHeader && {
        user: req.get(findHeader),
      }
    }

    try {
      if (samlUser) {
        delete global.saml[req.cookies.saml_user]
        res.clearCookie('saml_user', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        })
      } else if (validateAuth) {
        // Remote/x509 auth is configured. If header missing, raise MissingHeaderError.
        if (!findHeader) {
          throw new MissingHeaderError(JSON.stringify(req.headers))
        }
        // If header is present, continue — remoteUser was already built above.
      } else {
        // No remote auth and no saml user info: this is the expected missing SAML info case.
        throw new MissingSamlUserInfoError(req?.cookies?.saml_user)
      }
      
      const paramsAxios = {
        method: POST,
        url: `${defaultProtocol}://${defaultIP}:${
          appConfig.port || defaultPort
        }/${defaultAppName}/api/auth`,
        data: remoteUser,
        validateStatus: (status) => status >= 200 && status <= 400,
      }

      const jwt = await axios(paramsAxios)

      jwt?.data?.data?.token && (remoteJWT.jwt = jwt.data.data.token)
      jwt?.data?.data?.id && (remoteJWT.id = jwt.data.data.id)
    } catch (e) {
      writeInLogger(e)
    }
  }

  const appName = parse(req.url)
    .pathname.split(/\//gi)
    .filter((sub) => sub?.length > 0)
    .find((resource) => APP_NAMES.includes(resource))
  const sheets = new ServerStyleSheets()

  const PRELOAD_STATE = {}

  if (appConfig?.default_zone?.id !== undefined && PRELOAD_STATE?.general) {
    PRELOAD_STATE.general = {
      ...PRELOAD_STATE.general,
      ...{
        zone: appConfig.default_zone.id,
        defaultZone: appConfig.default_zone.id,
      },
    }
  }

  const faviconLink =
    encodedFavIcon && encodedFavIcon?.b64 !== null
      ? `<link rel="icon" href="${encodedFavIcon.b64}">`
      : `
      <link rel="icon" type="image/png" href="${STATIC_FILES_URL}/favicon/${appName}/favicon.ico">
      <link rel="apple-touch-icon" sizes="180x180" href="${STATIC_FILES_URL}/favicon/${appName}/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="${STATIC_FILES_URL}/favicon/${appName}/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="${STATIC_FILES_URL}/favicon/${appName}/favicon-16x16.png">
    `

  const remoteModules = `
    <script id="preload-remotes-config">
      window.__REMOTES_MODULE_CONFIG__ = ${JSON.stringify(remotesConfig)}
    </script>`

  const forecastConf = `
    <script id="preload-forecast-config">
      window.__FORECAST_CONFIG__ = ${JSON.stringify(forecastConfig)}
    </script>`

  const config = `
    <script id="preload-server-side">
      window.__PRELOADED_CONFIG__ = ${ensuredScriptValue(APP_CONFIG[appName])}
      window.__REMOTE_AUTH__ = ${JSON.stringify(remoteJWT)}
    </script>`

  const requestTimeOut = `
    <script id="preload-axios-config">
      window.__GLOBAL_API_TIMEOUT__ = ${globalApiTimeout(appConfig)}
    </script>`

  const storeRender = `
    <script id="preloadState">
      window.__PRELOADED_STATE__ = ${ensuredScriptValue(PRELOAD_STATE)}
    </script>`

  const css = `<style id="jss-server-side">${sheets.toString()}</style>`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${upperCaseFirst(appName ?? 'FireEdge')} by OpenNebula</title>
      ${faviconLink}
      <meta name="theme-color" content="#ffffff">
      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      ${css}
    </head>
    <body>
      <div id="root"/>
      ${storeRender}
      ${config}
      ${requestTimeOut}
      ${remoteModules}
      ${forecastConf}
      <script src='${APP_URL}/client/bundle.${appName}.js'></script>
    </body>
    </html>
  `
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})

module.exports = router
