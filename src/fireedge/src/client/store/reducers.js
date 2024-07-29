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
const { combineReducers } = require('@reduxjs/toolkit')
const Auth = require('client/features/Auth/slice')
const General = require('client/features/General/slice')
const Persistent = require('client/features/Persistent/slice')
const { oneApi } = require('client/features/OneApi')

const rootReducer = combineReducers({
  general: General.reducer,
  auth: Auth.reducer,
  [oneApi.reducerPath]: oneApi.reducer,
  [Persistent.name]: Persistent.reducer,
})

module.exports = rootReducer
