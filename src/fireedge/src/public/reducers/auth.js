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

const actions = require('client/actions/user');
const { jwtName } = require('client/constants');
const { console } = require('window-or-global');

const jwt =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(jwtName) ??
      window.sessionStorage.getItem(jwtName) ??
      null
    : null;

const initial = {
  jwt,
  user: null,
  error: null,
  isLoading: false,
  firstRender: true
};

const authentication = (state = initial, action) => {
  switch (action.type) {
    case actions.LOGIN_REQUEST:
      return {
        isLoading: true
      };
    case actions.LOGIN_SUCCESS:
      return {
        isLoading: false,
        jwt: action.jwt
      };
    case actions.LOGIN_FAILURE:
      return {
        isLoading: false,
        error: action.message
      };
    case actions.LOGOUT:
      return {
        ...state,
        jwt: null,
        user: null,
        error: null
      };
    case actions.USER_REQUEST:
      return {
        ...state,
        isLoading: true
      };
    case actions.USER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        user: action.user
      };
    case actions.USER_FAILURE:
      return {
        isLoading: false,
        error: action.message
      };
    default:
      return state;
  }
};

module.exports = authentication;
