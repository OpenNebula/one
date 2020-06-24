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

const { from, httpMethod } = require('./defaults');
const acl = require('./commands/acl-commands');
const cluster = require('./commands/cluster-commands');
const datastore = require('./commands/datastore-commands');
const document = require('./commands/document-commands');
const group = require('./commands/group-commands');
const groupsec = require('./commands/groupsec-commands');
const hook = require('./commands/hook-commands');
const host = require('./commands/host-commands');
const image = require('./commands/image-commands');
const market = require('./commands/market-commands');
const system = require('./commands/system-commans');
const template = require('./commands/template-commands');
const user = require('./commands/user-commands');
const vdc = require('./commands/vdc-commans');
const vm = require('./commands/vm-commands');
const vmgroup = require('./commands/vmgroup-commands');
const vn = require('./commands/vn-commands');
const vntemplate = require('./commands/vntemplate-commands');
const vrouter = require('./commands/vrouter-commands');
const zone = require('./commands/zone-commands');

module.exports = {
  ...acl(from, httpMethod),
  ...cluster(from, httpMethod),
  ...datastore(from, httpMethod),
  ...document(from, httpMethod),
  ...group(from, httpMethod),
  ...groupsec(from, httpMethod),
  ...hook(from, httpMethod),
  ...host(from, httpMethod),
  ...image(from, httpMethod),
  ...market(from, httpMethod),
  ...system(from, httpMethod),
  ...template(from, httpMethod),
  ...user(from, httpMethod),
  ...vdc(from, httpMethod),
  ...vm(from, httpMethod),
  ...vmgroup(from, httpMethod),
  ...vn(from, httpMethod),
  ...vntemplate(from, httpMethod),
  ...vrouter(from, httpMethod),
  ...zone(from, httpMethod)
};
