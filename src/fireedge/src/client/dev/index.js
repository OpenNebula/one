/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

import * as React from 'react'
import { render } from 'react-dom'

import { createStore } from 'client/store'
import App from 'client/dev/_app'

const { store } = createStore({ initState: window.REDUX_DATA })

render(<App store={store} />, document.getElementById('root'))

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./_app', () => {
    const SyncApp = require('./_app').default
    render(<SyncApp store={store} />, document.getElementById('root'))
  })

  module.hot.accept('../reducers', () => {
    store.replaceReducer(require('../reducers').default)
  })
}
