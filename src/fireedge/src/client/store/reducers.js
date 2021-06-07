const { combineReducers } = require('redux')
const General = require('client/features/General')
const Auth = require('client/features/Auth')
const One = require('client/features/One')

const rootReducer = combineReducers({
  general: General.reducer,
  auth: Auth.reducer,
  one: One.reducer
})

module.exports = rootReducer
