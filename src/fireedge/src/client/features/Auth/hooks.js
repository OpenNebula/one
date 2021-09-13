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
import * as actionsView from 'client/features/Auth/actionsView'
import { name as authSlice } from 'client/features/Auth/slice'
import { name as oneSlice, RESOURCES } from 'client/features/One/slice'

export const useAuth = () => {
  const auth = useSelector(state => state[authSlice], shallowEqual)
  const groups = useSelector(state => state[oneSlice][RESOURCES.group], shallowEqual)

  const { user, jwt, view, views, isLoginInProgress } = auth

  const userGroups = [user?.GROUPS?.ID]
    .flat()
    .map(id => groups.find(({ ID }) => ID === id))
    .filter(Boolean)

  const isLogged = !!jwt && !!userGroups?.length && !isLoginInProgress

  /**
   * Looking for resource view of user authenticated.
   *
   * @param {string} resourceName - Name of resource: VM, HOST, IMAGE, etc
   * @returns {{
   * resource_name: string,
   * actions: object[],
   * filters: object[],
   * info-tabs: object[],
   * dialogs: object[]
   * }} Returns view of resource
   */
  const getResourceView = resourceName => views?.[view]
    ?.find(({ resource_name: name }) => name === resourceName)

  return { ...auth, groups: userGroups, isLogged, getResourceView }
}

export const useAuthApi = () => {
  const dispatch = useDispatch()

  const unwrapDispatch = useCallback(
    action => dispatch(action).then(unwrapResult)
    , [dispatch]
  )

  return {
    login: user => unwrapDispatch(actions.login(user)),
    getAuthUser: () => dispatch(actions.getUser()),
    changeGroup: data => unwrapDispatch(actions.changeGroup(data)),
    logout: () => dispatch(actions.logout()),

    getSunstoneViews: () => unwrapDispatch(actionsView.getSunstoneViews()),
    getSunstoneConfig: () => unwrapDispatch(actionsView.getSunstoneConfig()),
    changeView: data => dispatch(actionsView.changeView(data))
  }
}
