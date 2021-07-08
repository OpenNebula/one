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
import { Actions, Commands } from 'server/utils/constants/commands/vn'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const vNetworkService = ({
  getVNetwork: ({ filter, id }) => {
    const name = Actions.VN_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    return RestClient.get(url, options).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.VNET ?? {}
    })
  },
  getVNetworks: data => {
    const name = Actions.VN_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'VNET')
  }
})
