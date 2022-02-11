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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import * as actions from 'client/features/Auth/actions'
import { name as authSlice } from 'client/features/Auth/slice'
import apiGroup from 'client/features/OneApi/group'
import apiSystem from 'client/features/OneApi/system'
import { RESOURCE_NAMES } from 'client/constants'

export const useAuth = () => {
  const auth = useSelector((state) => state[authSlice], shallowEqual)
  const { user, jwt, view, isLoginInProgress } = auth

  const { data: views } = apiSystem.endpoints.getSunstoneViews.useQuery(
    undefined,
    { skip: !jwt }
  )

  const { data: userGroups } = apiGroup.endpoints.getGroups.useQuery(
    undefined,
    {
      skip: !jwt,
      selectFromResult: ({ data: groups = [] }) => ({
        data: [user?.GROUPS?.ID]
          .flat()
          .map((id) => groups.find(({ ID }) => ID === id))
          .filter(Boolean),
      }),
    }
  )

  const isLogged = !!jwt && !!userGroups?.length && !isLoginInProgress

  /**
   * Looking for resource view of user authenticated.
   *
   * @param {RESOURCE_NAMES} resourceName - Name of resource
   * @returns {{
   * resource_name: string,
   * actions: object[],
   * filters: object[],
   * info-tabs: object,
   * dialogs: object[]
   * }} Returns view of resource
   */
  const getResourceView = useCallback(
    (resourceName) =>
      views?.[view]?.find(
        ({ resource_name: name }) =>
          String(name).toLowerCase() === String(resourceName).toLowerCase()
      ),
    [view]
  )

  return {
    ...auth,
    groups: userGroups,
    isLogged,
    getResourceView,
    views,
  }
}

export const useAuthApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    (action) => dispatch(action).then(unwrapResult),
    [dispatch]
  )

  return {
    login: (user) => unwrapDispatch(actions.login(user)),
    getAuthUser: () => dispatch(actions.getUser()),
    changeGroup: (group) => unwrapDispatch(actions.changeGroup(group)),
    logout: () => dispatch(actions.logout()),

    changeView: (view) => dispatch(actions.changeView(view)),
  }
}
