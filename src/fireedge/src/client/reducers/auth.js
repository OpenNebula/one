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

const { Actions: UserActions } = require('../actions/user')
const {
  JWT_NAME,
  FILTER_POOL,
  DEFAULT_LANGUAGE,
  DEFAULT_SCHEME
} = require('client/constants')

const jwt =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(JWT_NAME) ??
      window.sessionStorage.getItem(JWT_NAME) ??
      null
    : null

const initial = {
  jwt,
  user: null,
  group: null,
  error: null,
  filterPool: FILTER_POOL.ALL_RESOURCES,
  settings: {
    scheme: DEFAULT_SCHEME,
    lang: DEFAULT_LANGUAGE
  },
  isLoginInProcess: false,
  isLoading: false,
  firstRender: true
}

const authentication = (state = initial, action) => {
  switch (action.type) {
    case UserActions.START_AUTH:
      return {
        ...state,
        error: null,
        firstRender: false,
        isLoading: true
      }
    case UserActions.SUCCESS_AUTH:
      return {
        ...state,
        error: null,
        firstRender: false,
        isLoading: false,
        ...action.payload
      }
    case UserActions.SELECT_FILTER_GROUP:
      return {
        ...state,
        isLoading: false,
        isLoginInProcess: false,
        ...action.payload
      }
    case UserActions.CHANGE_SETTINGS:
      return {
        ...state,
        settings: action.payload
      }
    case UserActions.FAILURE_AUTH:
      return {
        ...state,
        jwt: null,
        firstRender: false,
        isLoading: false,
        isLoginInProcess: false,
        ...action.payload
      }
    case UserActions.LOGOUT:
      return {
        ...initial,
        jwt: null,
        firstRender: false
      }
    default:
      return state
  }
}

module.exports = authentication
