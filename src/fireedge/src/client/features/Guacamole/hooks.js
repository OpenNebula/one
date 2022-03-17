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

import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import { name as guacSlice, actions } from 'client/features/Guacamole/slice'
import { GuacamoleSession } from 'client/constants'

const {
  addGuacamoleSession,
  removeGuacamoleSession,
  updateThumbnail,
  setConnectionState,
  setTunnelUnstable,
  setMultiTouchSupport,
} = actions

// --------------------------------------------------------------
// Guacamole Hooks
// --------------------------------------------------------------

/**
 * Hook to get the state of Guacamole sessions.
 *
 * @param {string} [id] - Session id to subscribe
 * @returns {object|GuacamoleSession} Return Guacamole session by id or global state
 */
export const useGuacamole = (id) => {
  const guac = useSelector(
    (state) => (id ? state[guacSlice][id] : state[guacSlice]),
    shallowEqual
  )

  return useMemo(() => ({ ...guac }), [guac])
}

/**
 * Hook to manage Guacamole sessions.
 *
 * @param {string} [id] - Session id to operate
 * @returns {object} Return management actions
 */
export const useGuacamoleApi = (id) => {
  const dispatch = useDispatch()

  const commonDispatch = useCallback(
    (action) => (data) => dispatch(action({ id, ...data })),
    [dispatch, id]
  )

  return {
    addSession: commonDispatch(addGuacamoleSession),
    removeSession: commonDispatch(removeGuacamoleSession),
    updateThumbnail: commonDispatch(updateThumbnail),
    setConnectionState: commonDispatch(setConnectionState),
    setTunnelUnstable: commonDispatch(setTunnelUnstable),
    setMultiTouchSupport: commonDispatch(setMultiTouchSupport),
  }
}
