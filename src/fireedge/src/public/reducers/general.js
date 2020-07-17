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

const actions = require('../actions/general');

const initial = {
  isOpenMenu: false,
  zone: 0,
  loading: true
};

const General = (state = initial, action) => {
  switch (action.type) {
    case actions.DISPLAY_LOADING: {
      return { ...state, ...action.payload };
    }
    case actions.CHANGE_ZONE: {
      return { ...state, ...action.payload };
    }
    case actions.DISPLAY_MENU: {
      return { ...state, ...action.payload };
    }
    default:
      return state;
  }
};

module.exports = General;
