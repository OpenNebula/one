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
import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'

export const authService = ({
  login: user => RestClient.post('/api/auth', user).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data
  }),
  getUser: () => RestClient.get('/api/user/info').then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.USER ?? {}
  }),
  getSunstoneViews: () => RestClient.get('/api/sunstone/views').then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  }),
  getSunstoneConfig: () => RestClient.get('/api/user/config').then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })
})
