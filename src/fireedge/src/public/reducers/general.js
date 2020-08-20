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

const { Actions: PoolActions } = require('../actions/pool');
const { Actions: UserActions } = require('../actions/user');
const { Actions: GeneralActions } = require('../actions/general');

const initial = {
  zone: 0,
  isLoading: false,
  isOpenMenu: false
};

const General = (state = initial, action) => {
  switch (action.type) {
    case PoolActions.START_ONE_REQUEST:
      return { ...state, isLoading: true };
    case PoolActions.SUCCESS_ONE_REQUEST:
      return { ...state, isLoading: false };
    case PoolActions.FAILURE_ONE_REQUEST:
      return { ...state, isLoading: false };
    case GeneralActions.CHANGE_ZONE:
      return { ...state, ...action.payload };
    case GeneralActions.TOGGLE_MENU:
      return { ...state, isOpenMenu: action.isOpen };
    case UserActions.LOGOUT:
      return { ...initial };
    default:
      return state;
  }
};

module.exports = General;
