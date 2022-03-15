/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
const { Router } = require('express')
const { renderToString } = require('react-dom/server')
const root = require('window-or-global')
const { createStore, compose, applyMiddleware } = require('redux')
const thunk = require('redux-thunk').default
const { ServerStyleSheets } = require('@mui/styles')
const rootReducer = require('client/store/reducers')
const { getFireedgeConfig } = require('server/utils/yml')
const {
  availableLanguages,
  defaultApps,
} = require('server/utils/constants/defaults')
const { APP_URL, STATIC_FILES_URL } = require('client/constants')
const { upperCaseFirst } = require('client/utils')

// settings
const appConfig = getFireedgeConfig()
const langs = appConfig.langs || availableLanguages

const languages = Object.keys(langs)
const scriptLanguages = languages.map((language) => ({
  key: language,
  value: `${langs[language]}`,
}))

const router = Router()

router.get('*', (req, res) => {
  const apps = Object.keys(defaultApps)
  const appName = req.url
    .split(/\//gi)
    .filter((sub) => sub?.length > 0)
    .find((resource) => apps.includes(resource))

  const sheets = new ServerStyleSheets()
  const composeEnhancer =
    (root && root.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

  // SSR redux store
  const store = createStore(
    rootReducer,
    composeEnhancer(applyMiddleware(thunk))
  )

  const storeRender = `<script id="preloadState">window.__PRELOADED_STATE__ = ${JSON.stringify(
    store.getState()
  ).replace(/</g, '\\u003c')}</script>`

  const App = require(`../../../client/apps/${appName}/index.js`).default

  const rootComponent = renderToString(
    sheets.collect(<App location={req.url} store={store} />)
  )

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
      <script>${`langs = ${JSON.stringify(scriptLanguages)}`}</script>
      <script src='${APP_URL}/client/bundle.${appName}.js'></script>
    </body>
    </html>
  `
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})

module.exports = router
