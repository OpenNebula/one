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

const { Actions, Commands } = require('server/routes/api/vmpool/routes')
const { accounting, showback } = require('server/routes/api/vmpool/functions')

const { VM_POOL_ACCOUNTING_FILTER, VM_POOL_SHOWBACK_FILTER } = Actions

module.exports = [
  {
    ...Commands[VM_POOL_ACCOUNTING_FILTER],
    action: accounting,
  },
  {
    ...Commands[VM_POOL_SHOWBACK_FILTER],
    action: showback,
  },
]
