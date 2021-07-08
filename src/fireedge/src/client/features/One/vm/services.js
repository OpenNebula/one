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
import { Actions, Commands } from 'server/utils/constants/commands/vm'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const vmService = ({
  getVm: async ({ filter, id }) => {
    const name = Actions.VM_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    const res = await RestClient.get(url, options)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VM ?? {}
  },
  getVms: data => {
    const name = Actions.VM_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'VM')
  },
  actionVm: async ({ id, action }) => {
    const name = Actions.VM_ACTION
    const { url, options } = requestParams(
      { id, action },
      { name, ...Commands[name] }
    )

    const res = await RestClient.put(url, options?.data)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VM ?? {}
  },
  changePermissions: async ({ id, data }) => {
    const name = Actions.VM_CHMOD
    const { url, options } = requestParams(
      { id, ...data },
      { name, ...Commands[name] }
    )

    const res = await RestClient.put(url, options?.data)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res
  }
})
