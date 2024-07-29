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
import { useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import {
  name as supportAuthSlice,
  actions,
} from 'client/features/SupportAuth/slice'

// --------------------------------------------------------------
// Authenticate Hooks
// --------------------------------------------------------------

export const useSupportAuth = () => {
  const supportAuth = useSelector(
    (state) => state[supportAuthSlice],
    shallowEqual
  )
  const { user, isLoginInProgress } = supportAuth

  return useMemo(
    () => ({
      ...supportAuth,
      user,
      isLogged: !!user && !isLoginInProgress,
    }),
    [user, isLoginInProgress, supportAuth]
  )
}

export const useSupportAuthApi = () => {
  const dispatch = useDispatch()

  return {
    stopFirstRender: () => dispatch(actions.stopFirstRender()),
    login: () => dispatch(actions.login()),
    changeSupportAuthUser: (user) =>
      dispatch(actions.changeSupportAuthUser(user)),
    clearSupportAuthUser: () => dispatch(actions.clearSupportAuthUser()),
  }
}
