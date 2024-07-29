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
import { createSlice } from '@reduxjs/toolkit'
import { Status } from 'guacamole-common-js'

import { logout } from 'client/features/Auth/slice'
import { GUACAMOLE_STATES_STR } from 'client/constants'

const {
  IDLE,
  CONNECTING,
  WAITING,
  CONNECTED,
  DISCONNECTING,
  DISCONNECTED,
  CLIENT_ERROR,
  TUNNEL_ERROR,
} = GUACAMOLE_STATES_STR

const getIdentifiedFromPayload = ({ id, type } = {}) =>
  id?.includes('-') ? id : `${id}-${type}`

const INITIAL_SESSION = {
  thumbnail: null,
  multiTouchSupport: 0,
  clientState: {
    connectionState: IDLE,
    tunnelUnstable: false,
    statusCode: Status.Code.SUCCESS,
  },
  isUninitialized: true,
  isLoading: false,
  isConnected: false,
  isDisconnected: false,
  isError: false,
  clientProperties: {
    autoFit: true,
    scale: 1,
    minScale: 1,
    maxScale: 3,
    focused: false,
    scrollTop: 0,
    scrollLeft: 0,
  },
}

const slice = createSlice({
  name: 'guacamole',
  initialState: {},
  reducers: {
    addGuacamoleSession: (state, { payload }) => {
      const id = getIdentifiedFromPayload(payload)
      state[id] = { ...INITIAL_SESSION, token: payload?.token }
    },
    removeGuacamoleSession: (state, { payload }) => {
      const id = getIdentifiedFromPayload(payload)
      const { [id]: _, ...rest } = state

      return { ...rest }
    },
    updateGuacamoleSession: (state, { payload }) => {
      const id = getIdentifiedFromPayload(payload)
      const { [id]: session = {} } = state

      state[id] = { ...session, ...payload?.session }
    },
    setConnectionState: (state, { payload = {} }) => {
      const { state: cState, statusCode } = payload
      const id = getIdentifiedFromPayload(payload)
      const { [id]: session = {} } = state

      if (
        !session ||
        session?.clientState.connectionState === TUNNEL_ERROR ||
        session?.clientState.connectionState === CLIENT_ERROR
      )
        return state

      statusCode && (session.clientState.statusCode = statusCode)
      session.clientState.connectionState = cState
      session.clientState.tunnelUnstable = false

      session.isUninitialized = cState === IDLE
      session.isLoading = [WAITING, CONNECTING, DISCONNECTING].includes(cState)
      session.isConnected = cState === CONNECTED
      session.isDisconnected = cState === DISCONNECTED
      session.isError = [CLIENT_ERROR, TUNNEL_ERROR].includes(cState)
    },
    setTunnelUnstable: (state, { payload = {} }) => {
      const id = getIdentifiedFromPayload(payload)
      const { [id]: session = {} } = state

      session.clientState.tunnelUnstable = payload.unstable
    },
    setMultiTouchSupport: (state, { payload = {} }) => {
      const id = getIdentifiedFromPayload(payload)
      const { [id]: session = {} } = state

      state[id] = { ...session, multiTouchSupport: payload?.touches }
    },
    updateThumbnail: (state, { payload = {} }) => {
      const id = getIdentifiedFromPayload(payload)
      const { [id]: session = {} } = state

      state[id] = { ...session, thumbnail: payload?.thumbnail }
    },
  },
  extraReducers: (builder) => {
    /* LOGOUT ACTION */
    builder.addCase(logout, () => ({}))
  },
})

export const { name, reducer, actions } = slice
