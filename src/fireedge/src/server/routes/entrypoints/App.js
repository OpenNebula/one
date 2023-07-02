/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
const { renderToString } = require('react-dom/server')
const root = require('window-or-global')
const { createStore, compose, applyMiddleware } = require('redux')
const thunk = require('redux-thunk').default
const { ServerStyleSheets } = require('@mui/styles')
const { request: axios } = require('axios')
const { writeInLogger } = require('server/utils/logger')
const { MissingRemoteHeaderError } = require('server/utils/errors')

// server
const {
  getSunstoneConfig,
  getProvisionConfig,
  getFireedgeConfig,
} = require('server/utils/yml')
const {
  defaultApps,
  defaultAppName,
  defaultHeaderRemote,
} = require('server/utils/constants/defaults')

// client
const rootReducer = require('client/store/reducers')
const { upperCaseFirst } = require('client/utils')
const { APP_URL, STATIC_FILES_URL } = require('client/constants')

const APP_NAMES = Object.keys(defaultApps)

const ensuredScriptValue = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c')

const router = Router()

router.get('*', async (req, res) => {
  const remoteJWT = {}

  const APP_CONFIG = {
    [defaultApps.provision.name]: getProvisionConfig() || {},
    [defaultApps.sunstone.name]:
      getSunstoneConfig({ includeProtectedConfig: false }) || {},
  }

  const appConfig = getFireedgeConfig()
  if (appConfig?.auth === 'remote') {
    remoteJWT.remote = true
    remoteJWT.remoteRedirect = appConfig?.auth_redirect ?? '.'

    const finderHeader = () => {
      const headers = Object.keys(req.headers)

      return headers.find((header) => defaultHeaderRemote.includes(header))
    }
    const findHeader = finderHeader()
    try {
      if (!findHeader) {
        throw new MissingRemoteHeaderError(JSON.stringify(req.headers))
      }
      const remoteUser = req.get(findHeader)
      const jwt = await axios({
        method: 'POST',
        url: `${req.protocol}://${req.get('host')}/${defaultAppName}/api/auth`,
        data: {
          user: req.get(findHeader),
        },
        validateStatus: (status) => status >= 200 && status <= 400,
      })
      if (!global.remoteUsers) {
        global.remoteUsers = {}
      }
      global.remoteUsers[remoteUser] = {}

      jwt?.data?.data?.token &&
        (global.remoteUsers[remoteUser].jwt = remoteJWT.jwt =
          jwt.data.data.token)
      jwt?.data?.data?.id &&
        (global.remoteUsers[remoteUser].id = remoteJWT.id = jwt.data.data.id)
    } catch (e) {
      writeInLogger(e)
    }
  }

  const appName = parse(req.url)
    .pathname.split(/\//gi)
    .filter((sub) => sub?.length > 0)
    .find((resource) => APP_NAMES.includes(resource))

  const sheets = new ServerStyleSheets()
  const composeEnhancer =
    (root && root.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

  // SSR redux store
  const store = createStore(
    rootReducer,
    composeEnhancer(applyMiddleware(thunk))
  )

  const App = require(`../../../client/apps/${appName}/index.js`).default

  const rootComponent = renderToString(
    sheets.collect(<App location={req.url} store={store} />)
  )

  const config = `
    <script id="preload-server-side">
      window.__PRELOADED_CONFIG__ = ${ensuredScriptValue(APP_CONFIG[appName])}
      window.__REMOTE_AUTH__ = ${JSON.stringify(remoteJWT)}
    </script>`

  const storeRender = `
    <script id="preloadState">
      window.__PRELOADED_STATE__ = ${ensuredScriptValue(store.getState())}
    </script>`

  const css = `<style id="jss-server-side">${sheets.toString()}</style>`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${upperCaseFirst(appName ?? 'FireEdge')} by OpenNebula</title>
      <link rel="icon" type="image/png" href="${STATIC_FILES_URL}/favicon/${appName}/favicon.ico">
      <link rel="apple-touch-icon" sizes="180x180" href="${STATIC_FILES_URL}/favicon/${appName}/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="${STATIC_FILES_URL}/favicon/${appName}/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="${STATIC_FILES_URL}/favicon/${appName}/favicon-16x16.png">
      <meta name="theme-color" content="#ffffff">
      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      ${css}
    </head>
    <body>
      <div id="root">${rootComponent}</div>
      ${storeRender}
      ${config}
      <script src='${APP_URL}/client/bundle.${appName}.js'></script>
    </body>
    </html>
  `
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})

module.exports = router
