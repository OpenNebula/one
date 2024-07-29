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

const DATASTORES = 'datastores'
const TEMPLATES = 'templates'
const NETWORKS = 'networks'
const IMAGES = 'images'

const LIST = 'list'
const IMPORT = 'import'

const resourceFromData = {
  LIST,
  IMPORT,
}

const resources = {
  DATASTORES,
  TEMPLATES,
  NETWORKS,
  IMAGES,
}

const params = {
  [DATASTORES]: [
    {
      param: 'host',
      flag: '-h',
      for: [LIST, IMPORT],
    },
  ],
  [TEMPLATES]: [
    {
      param: 'datastore',
      flag: '--datastore',
      for: [LIST, IMPORT],
    },
    {
      param: 'host',
      flag: '-h',
      for: [LIST, IMPORT],
    },
    {
      param: 'folder',
      flag: '--folder',
      for: [IMPORT],
    },
    {
      param: 'linked_clone',
      flag: '--linked_clone',
      for: [IMPORT],
    },
  ],
  [NETWORKS]: [
    {
      param: 'host',
      flag: '-h',
      for: [LIST, IMPORT],
    },
  ],
  [IMAGES]: [
    {
      param: 'host',
      flag: '-h',
      for: [LIST, IMPORT],
    },
    {
      param: 'datastore',
      flag: '--datastore',
      for: [LIST, IMPORT],
    },
  ],
}

const paramsImportNetwork = {
  size: 'SIZE',
  type: 'TYPE',
  mac: 'MAC',
  ip: 'IP',
  globalPrefix: 'GLOBAL_PREFIX',
  ulaPrefix: 'ULA_PREFIX',
  ip6Global: 'IP6_GLOBAL',
}

module.exports = { resourceFromData, resources, params, paramsImportNetwork }
