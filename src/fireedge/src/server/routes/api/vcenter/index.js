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

const { Actions, Commands } = require('server/routes/api/vcenter/routes')
const {
  importVobject,
  list,
  listAll,
  cleartags,
  importHost,
  getToken,
} = require('server/routes/api/vcenter/functions')
const { resources } = require('server/routes/api/vcenter/command-flags')

const { TEMPLATES, DATASTORES, NETWORKS, IMAGES } = resources

const {
  VCENTER_TOKEN,
  VCENTER_CLEAR_TAGS,
  VCENTER_IMPORT_HOSTS,
  VCENTER_IMPORT_DATASTORES,
  VCENTER_IMPORT_TEMPLATES,
  VCENTER_IMPORT_NETWORKS,
  VCENTER_IMPORT_IMAGES,
  VCENTER_LIST_ALL,
  VCENTER_LIST,
} = Actions

module.exports = [
  {
    ...Commands[VCENTER_TOKEN],
    action: getToken,
  },
  {
    ...Commands[VCENTER_CLEAR_TAGS],
    action: cleartags,
  },
  {
    ...Commands[VCENTER_IMPORT_HOSTS],
    action: importHost,
  },
  {
    ...Commands[VCENTER_IMPORT_DATASTORES],
    action: (...args) => importVobject(...args, DATASTORES),
  },
  {
    ...Commands[VCENTER_IMPORT_NETWORKS],
    action: (...args) => importVobject(...args, NETWORKS),
  },
  {
    ...Commands[VCENTER_IMPORT_IMAGES],
    action: (...args) => importVobject(...args, IMAGES),
  },
  {
    ...Commands[VCENTER_IMPORT_TEMPLATES],
    action: (...args) => importVobject(...args, TEMPLATES),
  },
  {
    ...Commands[VCENTER_LIST_ALL],
    action: listAll,
  },
  {
    ...Commands[VCENTER_LIST],
    action: list,
  },
]
