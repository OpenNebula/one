const React = require('react')
const { Router } = require('express')
const { env } = require('process')
const { renderToString } = require('react-dom/server')
const root = require('window-or-global')
const { createStore, compose, applyMiddleware } = require('redux')
const thunk = require('redux-thunk').default
const { ServerStyleSheets } = require('@material-ui/core/styles')
const rootReducer = require('client/reducers')
const { getConfig } = require('server/utils/yml')
const { availableLanguages, defaultWebpackMode } = require('server/utils/constants/defaults')

// settings
const appConfig = getConfig()
const langs = appConfig.LANGS || availableLanguages
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
  const context = {}
  let store = ''
  let component = ''
  let css = ''
  let storeRender = ''
  let chunks = ''
  if (env && (!env.NODE_ENV || (env.NODE_ENV && env.NODE_ENV !== defaultWebpackMode))) {
    app = req.url.split(/\//gi).filter(sub => sub && sub.length > 0)[0]
    chunks = `<script src='/client/1.bundle.${app}.js'></script>`

    const composeEnhancer =
      // eslint-disable-next-line no-underscore-dangle
      (root && root.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose
    store = createStore(rootReducer(), composeEnhancer(applyMiddleware(thunk)))
    storeRender = `<script id="preloadState">window.__PRELOADED_STATE__ = ${JSON.stringify(
      store.getState()
    ).replace(/</g, '\\u003c')}</script>`
    // eslint-disable-next-line global-require
    const App = require('../../../client/app').default
    const sheets = new ServerStyleSheets()
    component = renderToString(
      sheets.collect(<App location={req.url} context={context} store={store} />)
    )
    css = `<style id="jss-server-side">${sheets.toString()}</style>`
  }
  const html = `
  <!DOCTYPE html>
    <html>
    <head>
      <link rel='shortcut icon' type='image/png' href='/client/assets/favicon.png' />
      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      ${css}
    </head>
    <body>
      <div id="root">${component}</div>
      ${storeRender}
      <script>${`langs = ${JSON.stringify(scriptLanguages)}`}</script>
      <script src='/client/bundle.${app}.js'></script>
      ${chunks}
    </body>
    </html>
  `
  res.send(html)
})

module.exports = router
