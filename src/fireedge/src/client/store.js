import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'

import thunkMiddleware from 'redux-thunk'

import * as General from 'client/features/General'
import * as Auth from 'client/features/Auth'
import * as One from 'client/features/One'

import { isDevelopment } from 'client/utils'

export const createStore = ({ initState = {}, services }) => {
  const middleware = getDefaultMiddleware({
    immutableCheck: true,
    serializableCheck: false,
    thunk: false
  })

  middleware.push(thunkMiddleware.withExtraArgument({ services }))

  const store = configureStore({
    reducer: {
      general: General.reducer,
      auth: Auth.reducer,
      one: One.reducer
    },
    devTools: isDevelopment(),
    middleware,
    preloadedState: initState
  })

  return { store }
}
