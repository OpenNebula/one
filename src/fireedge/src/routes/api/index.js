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

const { getRouteForOpennebulaCommand } = require('../../utils/opennebula');
const {
  private: functions2faPrivate,
  public: functions2faPublic
} = require('./routes/2fa');
const {
  private: functionsAuthPrivate,
  public: functionsAuthPublic
} = require('./routes/auth');
const {
  private: functionsOneflowPrivate,
  public: functionsOneflowPublic
} = require('./routes/oneflow');
const {
  private: functionsSupportPrivate,
  public: functionsSupportPublic
} = require('./routes/support');
const {
  private: functionsVcenterPrivate,
  public: functionsVcenterPublic
} = require('./routes/vcenter');
const {
  private: functionsZendeskPrivate,
  public: functionsZendeskPublic
} = require('./routes/zendesk');

const opennebulaActions = getRouteForOpennebulaCommand();
const routes = {
  private: [
    ...opennebulaActions,
    ...functions2faPrivate,
    ...functionsAuthPrivate,
    ...functionsOneflowPrivate,
    ...functionsSupportPrivate,
    ...functionsVcenterPrivate,
    ...functionsZendeskPrivate
  ],
  public: [
    ...functions2faPublic,
    ...functionsAuthPublic,
    ...functionsOneflowPublic,
    ...functionsSupportPublic,
    ...functionsVcenterPublic,
    ...functionsZendeskPublic
  ]
};
module.exports = routes;
