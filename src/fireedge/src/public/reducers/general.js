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

const initial = {
  logoff: false,
  displayMenu: false,
  zone: 0,
  loading: true
};

const General = (state = initial, action) => {
  switch (action.type) {
    case 'DISPLAY _LOADING': {
      const { loading } = action.payload;
      return {
        ...state,
        loading
      };
    }
    case 'CHANGE_ZONE': {
      const { zone } = action.payload;
      return {
        ...state,
        zone
      };
    }
    case 'LOG_OFF': {
      const { logoff } = action.payload;
      return {
        ...state,
        logoff
      };
    }
    case 'DISPLAY_MENU': {
      const { displayMenu } = action.payload;
      return {
        ...state,
        displayMenu
      };
    }
    default:
      return state;
  }
};

module.exports = General;
