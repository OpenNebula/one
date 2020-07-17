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

import React from 'react';
import { hydrate } from 'react-dom';
import { createStore } from 'redux';
import root from 'window-or-global';

import rootReducer from 'client/reducers';
import App from 'client/app';

const preloadedState = root.__PRELOADED_STATE__;

delete root.__PRELOADED_STATE__;

const store = createStore(
  rootReducer(),
  preloadedState,
  root.__REDUX_DEVTOOLS_EXTENSION__ && root.__REDUX_DEVTOOLS_EXTENSION__()
);

document.getElementById('preloadState').remove();

hydrate(<App store={store} />, document.getElementById('root'));
