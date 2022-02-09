/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import 'core-js'
import { JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { StaticRouter, BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { Store } from 'redux'

import MuiProvider from 'client/providers/muiProvider'
import NotistackProvider from 'client/providers/notistackProvider'
import { TranslateProvider } from 'client/components/HOC'

import App, { APP_NAME as SunstoneAppName } from 'client/apps/sunstone/_app'
import theme from 'client/apps/sunstone/theme'
import { APP_URL } from 'client/constants'
import { buildTranslationLocale } from 'client/utils'

buildTranslationLocale()

/**
 * @param {object} props - Props
 * @param {Store} props.store - Redux store
 * @param {string|object} props.location - The URL the server received
 * @param {object} props.context - Context object contains the results of the render
 * @returns {JSXElementConstructor} Sunstone App
 */
const Sunstone = ({ store = {}, location = '', context = {} }) => (
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
            <BrowserRouter basename={`${APP_URL}/${SunstoneAppName}`}>
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
  store: PropTypes.shape({}),
}

Sunstone.displayName = 'SunstoneApp'

export { SunstoneAppName }

export default Sunstone
