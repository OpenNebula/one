/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

/* ******* Eagerly consumed dependencies ******** *
 *                                                 *
 * These are explicitly imported by the client so
 * that they can be consumed by the submodules    */
import '@mui/material'
/* ---------------------------------------------- */

import 'core-js'
import PropTypes from 'prop-types'
import { JSXElementConstructor } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { BrowserRouter, StaticRouter } from 'react-router-dom'
import { Store } from 'redux'

import {
  SunstoneTheme as theme,
  PreloadConfigProvider,
  MuiProvider,
  NotiStackProvider,
} from '@ProvidersModule'
import { TranslateProvider } from '@ComponentsModule'
import App, { APP_NAME as SunstoneAppName } from 'client/apps/sunstone/_app'
import { APP_URL } from '@ConstantsModule'
import { buildTranslationLocale } from '@UtilsModule'

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
      <MuiProvider theme={theme}>
        <TranslateProvider>
          <NotiStackProvider>
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
          </NotiStackProvider>
        </TranslateProvider>
      </MuiProvider>
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
