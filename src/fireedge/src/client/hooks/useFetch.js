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

  return {
    [ACTIONS.REQUEST]: {
      ...INITIAL_STATE,
      status: STATUS.PENDING,
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
      error: payload
    }
  }[type] ?? state
}

const useFetch = request => {
  const cancelRequest = useRef(false)
  const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE)

  useEffect(() => {
    return () => {
      cancelRequest.current = true
    }
  }, [])

  const doFetch = useCallback(async (payload, reload = false) => {
    dispatch({ type: ACTIONS.REQUEST, reload })

    try {
      const response = await request(payload)

      if (response === undefined) throw response
      if (cancelRequest.current) return

      dispatch({ type: ACTIONS.SUCCESS, payload: response })
    } catch (error) {
      if (cancelRequest.current) return

      const errorMessage = typeof error === 'string' ? error : error?.message

      dispatch({ type: ACTIONS.FAILURE, payload: errorMessage })
    }
  }, [request])

  const fetchRequest = useCallback((payload, options = {}) => {
    const { reload = false, delay = 0 } = options

    if (!(Number.isInteger(delay) && delay >= 0)) {
      console.error(`
          Delay must be a number >= 0!
          If you're using it as a function, it must also return a number >= 0.`)
    }

    fakeDelay(delay).then(() => doFetch(payload, reload))
  }, [request])

  return { ...state, fetchRequest }
}
export default useFetch
