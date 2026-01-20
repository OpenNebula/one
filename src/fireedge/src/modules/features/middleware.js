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
import { Middleware } from '@reduxjs/toolkit'
import { logout } from '@modules/features/Auth/slice'
import { oneApi } from '@modules/features/OneApi'
import { T } from '@ConstantsModule'

/**
 * @param {object} store - Redux store
 * @returns {Middleware} - Unauthenticated middleware
 */
export const unauthenticatedMiddleware = (store) => (next) => {
  const { getState, dispatch } = store
  let canResetCache = true

  return (action) => {
    const { auth } = getState()
    const status = action?.payload?.status

    if (status != null) {
      if (status === 401 && canResetCache) {
        canResetCache = false
        dispatch(logout(auth?.isLoggedIn ? T.SessionExpired : undefined)) // Expired = true
        dispatch(oneApi.util.resetApiState()) // Expired = false
      } else if (status !== 401) {
        canResetCache = true
      }
    }

    return next(action)
  }
}
