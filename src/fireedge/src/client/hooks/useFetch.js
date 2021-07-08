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
import { useReducer, useCallback, useEffect, useRef } from 'react'
import { fakeDelay } from 'client/utils'

const STATUS = {
  INIT: 'INIT',
  PENDING: 'PENDING',
  ERROR: 'ERROR',
  FETCHED: 'FETCHED'
}

const ACTIONS = {
  REQUEST: 'REQUEST',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
}

const INITIAL_STATE = {
  status: STATUS.INIT,
  error: undefined,
  data: undefined,
  loading: false,
  reloading: false
}

const fetchReducer = (state, action) => {
  const { type, payload, reload = false } = action
  const { data: currentData } = state

  return {
    [ACTIONS.REQUEST]: {
      ...INITIAL_STATE,
      status: STATUS.PENDING,
      data: currentData,
      [reload ? 'reloading' : 'loading']: true
    },
    [ACTIONS.SUCCESS]: {
      ...INITIAL_STATE,
      status: STATUS.FETCHED,
      data: payload
    },
    [ACTIONS.FAILURE]: {
      ...INITIAL_STATE,
      status: STATUS.ERROR,
      data: currentData,
      error: payload
    }
  }[type] ?? state
}

const useFetch = (request, socket) => {
  const cancelRequest = useRef(false)
  const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE)

  const isFetched = state.data !== undefined && state.status === STATUS.FETCHED

  useEffect(() => {
    isFetched && socket?.connect({
      dataFromFetch: state.data,
      callback: socketData => dispatch({ type: ACTIONS.SUCCESS, payload: socketData })
    })

    return () => {
      socket?.disconnect()
    }
  }, [isFetched])

  useEffect(() => () => {
    cancelRequest.current = true
  }, [])

  const doFetch = useCallback(async (payload, reload = false) => {
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
    }
  }, [request, cancelRequest.current, dispatch])

  const fetchRequest = useCallback((payload, options = {}) => {
    const { reload = false, delay = 0 } = options

    if (!(Number.isInteger(delay) && delay >= 0)) {
      console.error(`
          Delay must be a number >= 0!
          If you're using it as a function, it must also return a number >= 0.`)
    }

    return fakeDelay(delay).then(() => doFetch(payload, reload))
  }, [request])

  return { ...state, fetchRequest, STATUS, ACTIONS, INITIAL_STATE }
}

export default useFetch
