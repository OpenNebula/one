/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

const React = require('react');
const express = require('express');
const { renderToString } = require('react-dom/server');
const root = require('window-or-global');
const { createStore, compose, applyMiddleware } = require('redux');
const thunk = require('redux-thunk').default;
const { ServerStyleSheets } = require('@material-ui/core/styles');
const rootReducer = require('../../public/reducers');
const { getConfig } = require('../../utils/yml');
const {
  includeMAPSJSbyHTML,
  includeJSbyHTML,
  includeCSSbyHTML
} = require('../../utils');
const {
  defaultIP,
  defaultPortHotReload
} = require('../../utils/constants/defaults');

const router = express.Router();

router.get('*', (req, res) => {
  const context = {};
  const pathPublic = `${__dirname}/public`;

  let store = '';
  let storeRender = '';
  let component = '';
  let css = '';
  if (process.env.ssr) {
    const composeEnhancer =
      // eslint-disable-next-line no-underscore-dangle
      (root && root.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
    store = createStore(
      rootReducer(getConfig),
      composeEnhancer(applyMiddleware(thunk))
    );
    storeRender = `<script id="preloadState">window.__PRELOADED_STATE__ = ${JSON.stringify(
      store.getState()
    ).replace(/</g, '\\u003c')}</script>`;

    // eslint-disable-next-line global-require
    const App = require('../../public/app').default;
    const sheets = new ServerStyleSheets();
    component = renderToString(
      sheets.collect(<App location={req.url} context={context} store={store} />)
    );
    css = `<style id="jss-server-side">${sheets.toString()}</style>`;
  }
  const html = `
  <!DOCTYPE html>
    <html>
    <head>
      <link rel='shortcut icon' type='image/png' href='/static/favicon.png' />
      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      ${css}
      ${includeCSSbyHTML(pathPublic)}
      ${
        process.env.hotreload
          ? `<script src="http://${defaultIP}:${defaultPortHotReload}/livereload.js"></script>`
          : ''
      }
    </head>
    <body>
      <div id="root">${component}</div>
      ${storeRender}
      ${includeJSbyHTML(pathPublic) + includeMAPSJSbyHTML(pathPublic)}
    </body>
    </html>
  `;

  res.send(html);
});
module.exports = router;
