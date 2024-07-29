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
import {
  useReducer,
  useCallback,
  useEffect,
  useRef,
  ReducerState,
  ReducerAction,
} from 'react'
import { fakeDelay, isDevelopment } from 'client/utils'

const STATUS = {
  INIT: 'INIT',
  PENDING: 'PENDING',
  ERROR: 'ERROR',
  FETCHED: 'FETCHED',
}

/** @enum {string} Type of action */
const ACTIONS = {
  REQUEST: 'REQUEST',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
}

const INITIAL_STATE = {
  status: STATUS.INIT,
  error: undefined,
  data: undefined,
  loading: false,
  reloading: false,
}

/**
 * @param {ReducerState} state - Current state of reducer
 * @param {ReducerAction} action - Action will be triggered
 * @returns {ReducerState} The reducer state modified with payload
 */
const fetchReducer = (state, action) => {
  const { type, payload, reload = false } = action
  const { data: currentData } = state

  return (
    {
      [ACTIONS.REQUEST]: {
        ...INITIAL_STATE,
        status: STATUS.PENDING,
        data: currentData,
        [reload ? 'reloading' : 'loading']: true,
      },
      [ACTIONS.SUCCESS]: {
        ...INITIAL_STATE,
        status: STATUS.FETCHED,
        data: payload,
      },
      [ACTIONS.FAILURE]: {
        ...INITIAL_STATE,
        status: STATUS.ERROR,
        data: currentData,
        error: payload,
      },
    }[type] ?? state
  )
}

/**
 * Hook to manage a request.
 *
 * @param {Promise} request - Request to fetch
 * @param {object} socket - Socket to update the global state after success
 * @param {Function} socket.connect - Connect to socket
 * @param {Function} socket.disconnect - Disconnect to socket
 * @returns {{
 * status: STATUS,
 * error: object|string,
 * data: object|Array,
 * loading: boolean,
 * reloading: boolean,
 * fetchRequest: Function,
 * STATUS: STATUS,
 * ACTIONS: ACTIONS
 * }} - List of functions to interactive with FireEdge sockets
 */
const useFetch = (request, socket) => {
  const cancelRequest = useRef(false)
  const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE)

  const isFetched = state.data !== undefined && state.status === STATUS.FETCHED

  useEffect(() => {
    isFetched &&
      socket?.connect({
        dataFromFetch: state.data,
        callback: (socketData) =>
          socketData &&
          dispatch({ type: ACTIONS.SUCCESS, payload: socketData }),
      })

    return () => {
      socket?.disconnect()
    }
  }, [isFetched])

  useEffect(() => {
    cancelRequest.current = false

    return () => {
      cancelRequest.current = true
    }
  }, [])

  const doFetch = useCallback(
    async (payload, reload = false) => {
      try {
        dispatch({ type: ACTIONS.REQUEST, reload })

        const response = await request(payload)

        if (response === undefined) throw response
        if (cancelRequest.current) return

        dispatch({ type: ACTIONS.SUCCESS, payload: response })

        return response
      } catch (error) {
        if (cancelRequest.current) return

        const errorMessage = typeof error === 'string' ? error : error?.message

        dispatch({ type: ACTIONS.FAILURE, payload: errorMessage })

        return error
      }
    },
    [request, cancelRequest.current, dispatch]
  )

  const fetchRequest = useCallback(
    /**
     * @param {Array|string|number|object} [payload] - Payload to request
     * @param {object} options - Options to trigger the request
     * @param {boolean} options.reload
     * - If `true`, the state will be change `reloading` instead of `loading`
     * @param {number} options.delay - Delay to trigger the request
     * @returns {Promise} - Returns a promise with response or error
     */
    async (payload, options = {}) => {
      const { reload = false, delay = 0 } = options

      if (!(Number.isInteger(delay) && delay >= 0)) {
        isDevelopment() &&
          console.error(`
          Delay must be a number >= 0!
          If you're using it as a function, it must also return a number >= 0.`)
      }

      await fakeDelay(delay)

      return await doFetch(payload, reload)
    },
    [request]
  )

  return { ...state, fetchRequest, STATUS }
}

export default useFetch
