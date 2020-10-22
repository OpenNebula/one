/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React from 'react'
import { hydrate, render } from 'react-dom'
import { createStore } from 'redux'
import root from 'window-or-global'

import rootReducer from 'client/reducers'
import App from 'client/app'

// eslint-disable-next-line no-underscore-dangle
const preloadedState = root.__PRELOADED_STATE__

// eslint-disable-next-line no-underscore-dangle
delete root.__PRELOADED_STATE__

const store = createStore(
  rootReducer(),
  preloadedState,
  // eslint-disable-next-line no-underscore-dangle
  root.__REDUX_DEVTOOLS_EXTENSION__ && root.__REDUX_DEVTOOLS_EXTENSION__()
)

const element = document.getElementById('preloadState')
if (element) {
  element.remove()
}
const mainDiv = document.getElementById('root')
const renderMethod = mainDiv && mainDiv.innerHTML !== '' ? hydrate : render

renderMethod(<App store={store} app='provision' />, document.getElementById('root'))
