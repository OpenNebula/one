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
import { configureStore, Middleware, EnhancedStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import storage from 'redux-persist/lib/storage'
import { persistStore, persistReducer } from 'redux-persist'

import { isDevelopment } from 'client/utils'

import * as Auth from 'client/features/Auth/slice'
import * as SupportAuth from 'client/features/SupportAuth/slice'
import * as General from 'client/features/General/slice'
import * as Persistent from 'client/features/Persistent/slice'
import * as Guacamole from 'client/features/Guacamole/slice'
import { oneApi } from 'client/features/OneApi'
import { unauthenticatedMiddleware } from 'client/features/middleware'

const persistConfig = {
  key: 'root',
  storage,
}

const persistedReducer = persistReducer(persistConfig, Persistent.reducer)

/**
 * @param {object} props - Props
 * @param {object} props.initState - Initial state
 * @param {Middleware[]} props.extraMiddleware - Extra middleware to apply on store
 * @returns {{ store: EnhancedStore }} Configured Redux Store
 */
export const createStore = ({ initState = {}, extraMiddleware = [] }) => {
  const store = configureStore({
    reducer: {
      [Auth.name]: Auth.reducer,
      [SupportAuth.name]: SupportAuth.reducer,
      [General.name]: General.reducer,
      [Guacamole.name]: Guacamole.reducer,
      [oneApi.reducerPath]: oneApi.reducer,
      [Persistent.name]: persistedReducer,
    },
    devTools: isDevelopment(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: true,
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
          ignoredPaths: ['persist'],
        },
      }).concat([
        ...extraMiddleware,
        unauthenticatedMiddleware,
        oneApi.middleware,
      ]),
    preloadedState: initState,
  })

  const persistor = persistStore(store)

  setupListeners(store.dispatch)

  return { store, persistor }
}
