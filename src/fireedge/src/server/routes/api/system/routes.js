/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

const {
  from: { query },
  httpMethod,
} = require('../../../utils/constants/defaults')

const basepath = '/system'
const { GET } = httpMethod

const SYSTEM_CONFIG = 'system.config'
const VMM_CONFIG = 'vmm.config'
const PROFILES = 'system.profiles'
const TAB_CONFIG = 'tab.config'
const DEFAULT_LABELS = 'defaultlabels.config'

const Actions = {
  SYSTEM_CONFIG,
  VMM_CONFIG,
  PROFILES,
  TAB_CONFIG,
  DEFAULT_LABELS,
}

module.exports = {
  Actions,
  Commands: {
    [SYSTEM_CONFIG]: {
      path: `${basepath}/config`,
      httpMethod: GET,
      auth: true,
    },
    [VMM_CONFIG]: {
      path: `${basepath}/vmmconfig`,
      httpMethod: GET,
      params: {
        hypervisor: {
          from: query,
          default: 'kvm',
        },
      },
      auth: true,
    },
    [PROFILES]: {
      path: `${basepath}/profiles`,
      httpMethod: GET,
      params: {
        id: {
          from: query,
          default: '-1',
        },
      },
      auth: true,
    },
    [TAB_CONFIG]: {
      path: `${basepath}/tab-manifest`,
      httpMethod: GET,
      auth: false,
    },
    [DEFAULT_LABELS]: {
      path: `${basepath}/default-labels`,
      httpMethod: GET,
      auth: true,
    },
  },
}
