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

import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import { name as guacSlice, actions } from 'client/features/Guacamole/slice'
import { GuacamoleSession, VM_ACTIONS } from 'client/constants'

const {
  addGuacamoleSession,
  removeGuacamoleSession,
  updateThumbnail,
  setConnectionState,
  setTunnelUnstable,
  setMultiTouchSupport,
} = actions

const { VNC, SSH, RDP } = VM_ACTIONS

/**
 * Returns Guacamole session identified by VM id or session id.
 *
 * @param {object} sessions - All current sessions from redux store
 * @param {string} vmId - Session id or VM id to filter
 * @returns {{
 * vnc: GuacamoleSession,
 * ssh: GuacamoleSession,
 * rdp: GuacamoleSession
 * }} Guacamole sessions by connection types
 */
const getFirstSessionByVmId = (sessions, vmId) => {
  const [id, connectionType] = vmId.includes('-') ? vmId.split('-') : [vmId]

  if (connectionType) return sessions[`${id}-${connectionType}`] ?? {}

  const filteredSessions = [VNC, SSH, RDP]
    .map((type) => [sessions[`${id}-${type}`], type])
    .filter(([session]) => Boolean(session))
    .reduce((res, [session, type]) => ({ ...res, [type]: session }), {})

  return filteredSessions ?? {}
}

// --------------------------------------------------------------
// Guacamole Hooks
// --------------------------------------------------------------

/**
 * Hook to get the state of Guacamole sessions.
 *
 * @param {string} [id] - Session id or VM id to subscribe
 * @returns {object|GuacamoleSession} Guacamole session or sessions
 */
export const useGuacamole = (id) => {
  const guac = useSelector(
    (state) =>
      id ? getFirstSessionByVmId(state[guacSlice], id) : state[guacSlice],
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
