/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

import React from 'react'
import PropTypes from 'prop-types'

import { StaticRouter, BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'
import root from 'window-or-global'

import SocketProvider from 'client/providers/socketProvider'
import MuiProvider from 'client/providers/muiProvider'
import NotistackProvider from 'client/providers/notistackProvider'
import { TranslateProvider } from 'client/components/HOC'

import Router from 'client/router'

if (process?.env?.NODE_ENV === 'development') {
  const webpackHotMiddlewareClient = require('webpack-hot-middleware/client')
  webpackHotMiddlewareClient.subscribeAll(function (message) {
    if (message?.action === 'built' && root?.location?.reload) {
      root.location.reload()
    }
  })
}

const App = ({ location, context, store, app }) => {
  let appName = app
  if (
    process?.env?.NODE_ENV === 'development' &&
    typeof window !== 'undefined'
  ) {
    appName = window.location.pathname.split('/')[1]
  }

  return (
    <MuiProvider app={appName} location={location}>
      <ReduxProvider store={store}>
        <NotistackProvider>
          <SocketProvider>
            <TranslateProvider>
              {location && context ? (
              // server build
                <StaticRouter location={location} context={context}>
                  <Router app={appName} />
                </StaticRouter>
              ) : (
              // browser build
                <BrowserRouter basename={`/${appName}`}>
                  <Router app={appName} />
                </BrowserRouter>
              )}
            </TranslateProvider>
          </SocketProvider>
        </NotistackProvider>
      </ReduxProvider>
    </MuiProvider>
  )
}

App.propTypes = {
  location: PropTypes.string,
  context: PropTypes.shape({}),
  store: PropTypes.shape({}),
  app: PropTypes.string
}

App.defaultProps = {
  location: '',
  context: {},
  store: {},
  app: undefined
}

export default App
