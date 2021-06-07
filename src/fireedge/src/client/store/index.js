import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'

import thunkMiddleware from 'redux-thunk'

import rootReducer from 'client/store/reducers'
import { isDevelopment } from 'client/utils'

export const createStore = ({ initState = {}, services }) => {
  const middleware = getDefaultMiddleware({
    immutableCheck: true,
    serializableCheck: false,
    thunk: false
  })

  middleware.push(thunkMiddleware.withExtraArgument({ services }))

  const store = configureStore({
    reducer: rootReducer,
    devTools: isDevelopment(),
    middleware,
    preloadedState: initState
  })

  return { store }
}
