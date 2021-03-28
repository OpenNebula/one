const React = require('react')
const { Router } = require('express')
const { env } = require('process')
const { renderToString } = require('react-dom/server')
const root = require('window-or-global')
const path = require('path')
const { createStore, compose, applyMiddleware } = require('redux')
const thunk = require('redux-thunk').default
const { ServerStyleSheets } = require('@material-ui/core/styles')
const { ChunkExtractor } = require('@loadable/server')
const rootReducer = require('client/reducers')
const { getConfig } = require('server/utils/yml')
const {
  availableLanguages, defaultWebpackMode, defaultApps, defaultFileStats
} = require('server/utils/constants/defaults')
const { APP_URL, STATIC_FILES_URL } = require('client/constants')
const { capitalize } = require('client/utils')

// settings
const appConfig = getConfig()
const langs = appConfig.langs || availableLanguages
const scriptLanguages = []
const languages = Object.keys(langs)
languages.map(language =>
  scriptLanguages.push({
    key: language,
    value: `${langs[language]}`
  })
)

const router = Router()

router.get('*', (req, res) => {
  let app = 'dev'
  let title = 'FireEdge'
  const context = {}
  let store = ''
  let component = ''
  let css = ''
  let storeRender = ''

  // production
  if (env && (!env.NODE_ENV || (env.NODE_ENV && env.NODE_ENV !== defaultWebpackMode))) {
    const App = require('../../../client/dev/_app.js').default
    const sheets = new ServerStyleSheets()
    const composeEnhancer = (root && root.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose
    const apps = Object.keys(defaultApps)
    const parseUrl = req.url.split(/\//gi).filter(sub => sub && sub.length > 0)

    parseUrl.forEach(element => {
      if (element && apps.includes(element)) {
        app = element
        title = element
      }
    })

    // loadable
    const statsFile = path.resolve(__dirname, 'client', app + defaultFileStats)
    const extractor = new ChunkExtractor({ statsFile })

    // SSR redux store
    store = createStore(rootReducer(), composeEnhancer(applyMiddleware(thunk)))
    storeRender = `<script id="preloadState">window.__PRELOADED_STATE__ = ${
      JSON.stringify(store.getState()).replace(/</g, '\\u003c')
    }</script>`

    component = renderToString(
      extractor.collectChunks(
        sheets.collect(
          <App location={req.url} context={context} store={store} />
        )
      )
    )

    css = `<style id="jss-server-side">${sheets.toString()}</style>`
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>${capitalize(title)} by OpenNebula</title>
      <link rel="icon" type="image/png" href="${STATIC_FILES_URL}/favicon/${app}/favicon.ico">
      <link rel="apple-touch-icon" sizes="180x180" href="${STATIC_FILES_URL}/favicon/${app}/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="${STATIC_FILES_URL}/favicon/${app}/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="${STATIC_FILES_URL}/favicon/${app}/favicon-16x16.png">
      <meta name="theme-color" content="#ffffff">
      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      ${css}
    </head>
    <body>
      <div id="root">${component}</div>
      ${storeRender}
      <script>${`langs = ${JSON.stringify(scriptLanguages)}`}</script>
      <script src='${APP_URL}/client/bundle.${app}.js'></script>
    </body>
    </html>
  `
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})

module.exports = router
