/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

const { Commands: acl } = require('./acl')
const { Commands: backupjobs } = require('./backupjobs')
const { Commands: cluster } = require('./cluster')
const { Commands: datastore } = require('./datastore')
const { Commands: document } = require('./document')
const { Commands: group } = require('./group')
const { Commands: secgroup } = require('./secgroup')
const { Commands: hook } = require('./hook')
const { Commands: host } = require('./host')
const { Commands: image } = require('./image')
const { Commands: market } = require('./market')
const { Commands: marketapp } = require('./marketapp')
const { Commands: system } = require('./system')
const { Commands: template } = require('./template')
const { Commands: user } = require('./user')
const { Commands: vdc } = require('./vdc')
const { Commands: vm } = require('./vm')
const { Commands: vmgroup } = require('./vmgroup')
const { Commands: vn } = require('./vn')
const { Commands: vntemplate } = require('./vntemplate')
const { Commands: vrouter } = require('./vrouter')
const { Commands: zone } = require('./zone')

module.exports = {
  ...acl,
  ...backupjobs,
  ...cluster,
  ...datastore,
  ...document,
  ...group,
  ...secgroup,
  ...hook,
  ...host,
  ...image,
  ...market,
  ...marketapp,
  ...system,
  ...template,
  ...user,
  ...vdc,
  ...vm,
  ...vmgroup,
  ...vn,
  ...vntemplate,
  ...vrouter,
  ...zone,
}
