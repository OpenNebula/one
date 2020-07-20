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
const App = require('../../public/app').default;
const { getConfig } = require('../../utils/yml');
const {
  includeMAPSJSbyHTML,
  includeJSbyHTML,
  includeCSSbyHTML
} = require('../../utils');

const router = express.Router();

router.get('*', (req, res) => {
  const context = {};
  const pathPublic = `${__dirname}/public`;

  const composeEnhancer =
    // eslint-disable-next-line no-underscore-dangle
    (root && root.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

  const store = createStore(
    rootReducer(getConfig),
    composeEnhancer(applyMiddleware(thunk))
  );

  const sheets = new ServerStyleSheets();
  const component = renderToString(
    sheets.collect(<App location={req.url} context={context} store={store} />)
  );
  const css = sheets.toString();

  const html = `
  <!DOCTYPE html>
    <html>
    <head>
      <link rel='shortcut icon' type='image/png' href='/static/favicon.png' />
      <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <style id="jss-server-side">${css}</style>
      ${includeCSSbyHTML(pathPublic)}
    </head>
    <body>
      <div id="root">${component}</div>
      <script id="preloadState">
        window.__PRELOADED_STATE__ = ${JSON.stringify(store.getState()).replace(
          /</g,
          '\\u003c'
        )}
      </script>
      ${includeJSbyHTML(pathPublic) + includeMAPSJSbyHTML(pathPublic)}
    </body>
    </html>
  `;

  if (context.url) {
    res.writeHead(301, { Location: context.url });
    res.end();
  } else {
    res.send(html);
  }
});
module.exports = router;
