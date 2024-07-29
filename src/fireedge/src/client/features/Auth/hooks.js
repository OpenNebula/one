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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import { name as generalSlice } from 'client/features/General/slice'
import { name as authSlice, actions, logout } from 'client/features/Auth/slice'
import groupApi from 'client/features/OneApi/group'
import systemApi from 'client/features/OneApi/system'
import { ResourceView } from 'client/apps/sunstone/routes'
import { areStringEqual } from 'client/models/Helper'
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

  const userLabels = useMemo(() => {
    const labels = user?.TEMPLATE?.LABELS?.split(',') ?? []

    return labels
      .filter(Boolean)
      .sort(areStringEqual({ numeric: true, ignorePunctuation: true }))
  }, [user?.TEMPLATE?.LABELS])

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
      labels: userLabels ?? [],
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

export const useSystemData = () => {
  const { data: oneConfig = {} } = systemApi.useGetOneConfigQuery()

  const { user } = useAuth()
  const userGroup = Array.isArray(user?.GROUPS?.ID)
    ? user?.GROUPS?.ID
    : [user?.GROUPS?.ID]
  const adminGroup = userGroup?.includes?.('0')

  return { oneConfig, adminGroup }
}

export const useDisableInputByUserAndConfig = (input = '') => {
  const { adminGroup, oneConfig } = useSystemData()

  return {
    disabled: !adminGroup && oneConfig.VM_RESTRICTED_ATTR?.includes?.(input),
  }
}

export const useAuthApi = () => {
  const dispatch = useDispatch()

  return {
    stopFirstRender: () => dispatch(actions.stopFirstRender()),
    logout: () => dispatch(logout()),
    changeView: (view) => dispatch(actions.changeView(view)),
    changeJwt: (jwt) => dispatch(actions.changeJwt(jwt)),
    changeAuthUser: (user) => dispatch(actions.changeAuthUser(user)),
    setErrorMessage: (message) => dispatch(actions.setErrorMessage(message)),
  }
}

// --------------------------------------------------------------
// View Hooks
// --------------------------------------------------------------

export const useViews = () => {
  const { jwt, view } = useSelector((state) => state[authSlice], shallowEqual)

  const { data: { views = {} } = {} } =
    systemApi.endpoints.getSunstoneViews.useQueryState(undefined, {
      skip: !jwt,
    })

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

  /**
   * Check if user has a view for a resource.
   *
   * @param {RESOURCE_NAMES} resourceName - Name of resource
   * @returns {boolean} Returns true if user has a view for a resource
   */
  const hasAccessToResource = useCallback(
    (resourceName) => !!getResourceView(resourceName),
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
      hasAccessToResource,
      getResourceView,
      views,
      view,
    }),
    [view]
  )
}
