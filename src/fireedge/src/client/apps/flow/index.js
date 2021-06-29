/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

import * as React from 'react'
import PropTypes from 'prop-types'

import { StaticRouter, BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'

import MuiProvider from 'client/providers/muiProvider'
import NotistackProvider from 'client/providers/notistackProvider'
import { TranslateProvider } from 'client/components/HOC'

import App from 'client/apps/flow/_app'
import theme from 'client/apps/flow/theme'
import { _APPS, APP_URL } from 'client/constants'

const APP_NAME = _APPS.sunstone.name

const Sunstone = ({ store, location, context }) => (
  <ReduxProvider store={store}>
    <TranslateProvider>
      <MuiProvider theme={theme}>
        <NotistackProvider>
          {location && context ? (
            // server build
            <StaticRouter location={location} context={context}>
              <App />
            </StaticRouter>
          ) : (
            // browser build
            <BrowserRouter basename={`${APP_URL}/${APP_NAME}`}>
              <App />
            </BrowserRouter>
          )}
        </NotistackProvider>
      </MuiProvider>
    </TranslateProvider>
  </ReduxProvider>
)

Sunstone.propTypes = {
  location: PropTypes.string,
  context: PropTypes.shape({}),
  store: PropTypes.shape({})
}

Sunstone.defaultProps = {
  location: '',
  context: {},
  store: {}
}

Sunstone.displayName = 'SunstoneApp'

export default Sunstone
