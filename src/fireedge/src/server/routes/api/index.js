/* eslint-disable import/no-dynamic-require */
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

const { messageTerminal } = require('server/utils/general');
const { getRouteForOpennebulaCommand } = require('server/utils/opennebula');

const config = {
  color: 'red',
  message: 'file not found: %s'
};
const files = ['2fa', 'auth', 'oneflow', 'support', 'vcenter', 'zendesk'];
const filesDataPrivate = [];
const filesDataPublic = [];
files.map(file => {
  try {
    // eslint-disable-next-line global-require
    const fileInfo = require(`./${file}`);
    if (fileInfo.private && fileInfo.private.length) {
      filesDataPrivate.push(fileInfo.private);
    }
    if (fileInfo.public && fileInfo.public.length) {
      filesDataPublic.push(fileInfo.public);
    }
  } catch (error) {
    if (error instanceof Error && error.code === 'MODULE_NOT_FOUND') {
      config.type = error.message;
      messageTerminal(config);
    }
  }
});
const opennebulaActions = getRouteForOpennebulaCommand();
const routes = {
  private: [...opennebulaActions, ...filesDataPrivate.flat()],
  public: [...filesDataPublic.flat()]
};
module.exports = routes;
