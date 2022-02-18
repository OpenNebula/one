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
import { configureStore, EnhancedStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'

import { isDevelopment } from 'client/utils'

import * as Auth from 'client/features/Auth/slice'
import * as General from 'client/features/General/slice'
import { authApi } from 'client/features/AuthApi'
import { oneApi } from 'client/features/OneApi'
import { unauthenticatedMiddleware } from 'client/features/middleware'

/**
 * @param {object} props - Props
 * @param {object} props.initState - Initial state
 * @returns {{ store: EnhancedStore }} Configured Redux Store
 */
export const createStore = ({ initState = {} }) => {
  const store = configureStore({
    reducer: {
      [Auth.name]: Auth.reducer,
      [General.name]: General.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [oneApi.reducerPath]: oneApi.reducer,
    },
    devTools: isDevelopment(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: true,
      }).concat([
        unauthenticatedMiddleware,
        authApi.middleware,
        oneApi.middleware,
      ]),
    preloadedState: initState,
  })

  setupListeners(store.dispatch)

  return { store }
}
