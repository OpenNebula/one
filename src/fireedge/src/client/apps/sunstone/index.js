/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { JSXElementConstructor } from 'react'

import { Provider as ReduxProvider } from 'react-redux'
import { BrowserRouter, StaticRouter } from 'react-router-dom'
import { Store } from 'redux'

import { TranslateProvider } from 'client/components/HOC'
import MuiProvider from 'client/providers/muiProvider'
import NotistackProvider from 'client/providers/notistackProvider'
import PreloadConfigProvider from 'client/providers/preloadConfigProvider'

import App, { APP_NAME as SunstoneAppName } from 'client/apps/sunstone/_app'
import theme from 'client/apps/sunstone/theme'
import { APP_URL } from 'client/constants'
import { buildTranslationLocale } from 'client/utils'

buildTranslationLocale()

/**
 * @param {object} props - Props
 * @param {Store} props.store - Redux store
 * @param {string|object} props.location - The URL the server received
 * @returns {JSXElementConstructor} Sunstone App
 */
const Sunstone = ({ store = {}, location = '' }) => (
  <PreloadConfigProvider>
    <ReduxProvider store={store}>
      <TranslateProvider>
        <MuiProvider theme={theme}>
          <NotistackProvider>
            {location ? (
              // server build
              <StaticRouter location={location}>
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
  </PreloadConfigProvider>
)

Sunstone.propTypes = {
  location: PropTypes.string,
  context: PropTypes.object,
  store: PropTypes.object,
}

Sunstone.displayName = 'SunstoneApp'

export { SunstoneAppName }

export default Sunstone
