/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

const { from, httpMethod } = require('../defaults');
const acl = require('./acl');
const cluster = require('./cluster');
const datastore = require('./datastore');
const document = require('./document');
const group = require('./group');
const groupsec = require('./groupsec');
const hook = require('./hook');
const host = require('./host');
const image = require('./image');
const market = require('./market');
const system = require('./system');
const template = require('./template');
const user = require('./user');
const vdc = require('./vdc');
const vm = require('./vm');
const vmgroup = require('./vmgroup');
const vn = require('./vn');
const vntemplate = require('./vntemplate');
const vrouter = require('./vrouter');
const zone = require('./zone');

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
