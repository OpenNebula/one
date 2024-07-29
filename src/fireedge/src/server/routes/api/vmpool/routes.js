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

const {
  httpMethod,
  from: fromData,
} = require('../../../utils/constants/defaults')

const basepath = '/vmpool'
const { GET } = httpMethod
const { query } = fromData

const VM_POOL_ACCOUNTING_FILTER = 'vmpool.accounting.filter'
const VM_POOL_SHOWBACK_FILTER = 'vmpool.showback.filter'

const Actions = {
  VM_POOL_ACCOUNTING_FILTER,
  VM_POOL_SHOWBACK_FILTER,
}

module.exports = {
  Actions,
  Commands: {
    [VM_POOL_ACCOUNTING_FILTER]: {
      path: `${basepath}/accounting/filtered`,
      httpMethod: GET,
      auth: true,
      params: {
        user: {
          from: query,
        },
        group: {
          from: query,
        },
        start: {
          from: query,
          default: -1,
        },
        end: {
          from: query,
          default: -1,
        },
      },
    },
    [VM_POOL_SHOWBACK_FILTER]: {
      path: `${basepath}/showback/filtered`,
      httpMethod: GET,
      auth: true,
      params: {
        user: {
          from: query,
        },
        group: {
          from: query,
        },
        startMonth: {
          from: query,
        },
        startYear: {
          from: query,
        },
        endMonth: {
          from: query,
        },
        endYear: {
          from: query,
        },
      },
    },
  },
}
