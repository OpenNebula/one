/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

const { Actions, Commands } = require('server/routes/api/marketapp/routes')
const {
  exportApp,
  importMarket,
  getDockerTags,
} = require('server/routes/api/marketapp/functions')

const {
  MARKETAPP_EXPORT,
  MARKETAPP_VMIMPORT,
  MARKETAPP_TEMPLATEIMPORT,
  MARKETAPP_DOCKERTAGS,
} = Actions

module.exports = [
  {
    ...Commands[MARKETAPP_EXPORT],
    action: exportApp,
  },
  {
    ...Commands[MARKETAPP_VMIMPORT],
    action: importMarket,
  },
  {
    ...Commands[MARKETAPP_TEMPLATEIMPORT],
    action: importMarket,
  },
  {
    ...Commands[MARKETAPP_DOCKERTAGS],
    action: getDockerTags,
  },
]
