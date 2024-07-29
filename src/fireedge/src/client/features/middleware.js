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
import { isRejectedWithValue, Middleware, Dispatch } from '@reduxjs/toolkit'

import authApi from 'client/features/OneApi/auth'
import { name as authName, logout } from 'client/features/Auth/slice'
import { T, ONEADMIN_GROUP_ID } from 'client/constants'

/**
 * @param {{ dispatch: Dispatch }} params - Redux parameters
 * @returns {Middleware} - Unauthenticated middleware
 */
export const unauthenticatedMiddleware =
  ({ dispatch }) =>
  (next) =>
  (action) => {
    if (
      authApi.endpoints.getAuthUser.matchRejected(action) ||
      (isRejectedWithValue(action) && action.payload.status === 401)
    ) {
      dispatch(logout(T.SessionExpired))
    }

    return next(action)
  }

/**
 * @param {{ dispatch: Dispatch, getState: function():object }} params - Redux parameters
 * @returns {Middleware} - Middleware to logout when user isn't in oneadmin group
 */
export const onlyForOneadminMiddleware =
  ({ dispatch, getState }) =>
  (next) =>
  (action) => {
    const groups = getState()?.[authName]?.user?.GROUPS?.ID

    if (!logout.match(action) && !!groups?.length) {
      const ensuredGroups = [groups].flat()

      !ensuredGroups.includes(ONEADMIN_GROUP_ID) &&
        dispatch(logout(T.OnlyForOneadminGroup))
    }

    return next(action)
  }
