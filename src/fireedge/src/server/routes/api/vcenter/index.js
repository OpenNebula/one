/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
  importVcenter,
  list,
  listAll,
  cleartags,
  hosts,
} = require('server/routes/api/vcenter/functions')

const {
  VCENTER_CLEARTAGS,
  VCENTER_HOSTS,
  VCENTER_IMPORT,
  VCENTER_LISTALL,
  VCENTER_LIST,
} = Actions

module.exports = [
  {
    ...Commands[VCENTER_CLEARTAGS],
    action: cleartags,
  },
  {
    ...Commands[VCENTER_HOSTS],
    action: hosts,
  },
  {
    ...Commands[VCENTER_IMPORT],
    action: importVcenter,
  },
  {
    ...Commands[VCENTER_LISTALL],
    action: listAll,
  },
  {
    ...Commands[VCENTER_LIST],
    action: list,
  },
]
