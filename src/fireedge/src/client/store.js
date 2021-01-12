import root from 'window-or-global'
import { createStore, compose, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import rootReducer from 'client/reducers'

const preloadedState = root.__PRELOADED_STATE__

delete root.__PRELOADED_STATE__

const composeEnhancer =
  (root && root.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

// The store now has the ability to accept thunk functions in `dispatch`
const store = createStore(
  rootReducer(),
  preloadedState,
  composeEnhancer(applyMiddleware(thunkMiddleware))
)

const element = document.getElementById('preloadState')
if (element) {
  element.remove()
}

export default store
