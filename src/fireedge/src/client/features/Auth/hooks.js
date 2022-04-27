/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import { name as generalSlice } from 'client/features/General/slice'
import { name as authSlice, actions } from 'client/features/Auth/slice'
import groupApi from 'client/features/OneApi/group'
import systemApi from 'client/features/OneApi/system'
import { ResourceView } from 'client/apps/sunstone/routes'
import {
  _APPS,
  RESOURCE_NAMES,
  ONEADMIN_ID,
  DEFAULT_SCHEME,
  DEFAULT_LANGUAGE,
} from 'client/constants'

const APPS_WITH_VIEWS = [_APPS.sunstone].map((app) => app.toLowerCase())

const appNeedViews = () => {
  const { appTitle } = useSelector((state) => state[generalSlice], shallowEqual)

  return useMemo(() => APPS_WITH_VIEWS.includes(appTitle), [appTitle])
}

// --------------------------------------------------------------
// Authenticate Hooks
// --------------------------------------------------------------

export const useAuth = () => {
  const auth = useSelector((state) => state[authSlice], shallowEqual)
  const { jwt, user, view, isLoginInProgress } = auth

  const waitViewToLogin = appNeedViews() ? !!view : true

  const { data: authGroups } = groupApi.endpoints.getGroups.useQueryState(
    undefined,
    {
      skip: !jwt || !user?.GROUPS?.ID,
      selectFromResult: ({ data: groups = [] }) => ({
        data: [user?.GROUPS?.ID]
          .flat()
          .map((id) => groups.find(({ ID }) => ID === id))
          .filter(Boolean),
      }),
    }
  )

  return useMemo(
    () => ({
      ...auth,
      user,
      isOneAdmin: user?.ID === ONEADMIN_ID,
      groups: authGroups,
      // Merge user settings with the defaults
      settings: {
        SCHEME: DEFAULT_SCHEME,
        LANG: DEFAULT_LANGUAGE,
        DISABLE_ANIMATIONS: 'NO',
        ...(user?.TEMPLATE ?? {}),
        ...(user?.TEMPLATE?.FIREEDGE ?? {}),
      },
      isLogged:
        !!jwt &&
        !!user &&
        !!authGroups?.length &&
        !isLoginInProgress &&
        waitViewToLogin,
    }),
    [user, jwt, isLoginInProgress, authGroups, auth, waitViewToLogin]
  )
}

export const useAuthApi = () => {
  const dispatch = useDispatch()

  return {
    stopFirstRender: () => dispatch(actions.stopFirstRender()),
    logout: () => dispatch(actions.logout()),
    changeView: (view) => dispatch(actions.changeView(view)),
    changeJwt: (jwt) => dispatch(actions.changeJwt(jwt)),
    changeAuthUser: (user) => dispatch(actions.changeAuthUser({ user })),
  }
}

// --------------------------------------------------------------
// View Hooks
// --------------------------------------------------------------

export const useViews = () => {
  const { jwt, view } = useSelector((state) => state[authSlice], shallowEqual)

  const { data: views } = systemApi.endpoints.getSunstoneViews.useQueryState(
    undefined,
    { skip: !jwt }
  )

  /**
   * Looking for resource view of user authenticated.
   *
   * @param {RESOURCE_NAMES} resourceName - Name of resource
   * @returns {ResourceView} Returns view of resource
   */
  const getResourceView = useCallback(
    (resourceName) =>
      views?.[view]?.find(
        ({ resource_name: name }) =>
          `${name}`.toLowerCase() === `${resourceName}`.toLowerCase()
      ),
    [view]
  )

  return useMemo(
    () => ({
      ...Object.values(RESOURCE_NAMES).reduce(
        (listOfResourceViews, resourceName) => ({
          ...listOfResourceViews,
          [resourceName]: getResourceView(resourceName),
        }),
        {}
      ),
      getResourceView,
      views,
      view,
    }),
    [view]
  )
}
