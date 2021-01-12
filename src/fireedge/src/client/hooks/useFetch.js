import { useState, useCallback, useEffect, useRef } from 'react'
import { debounce } from '@material-ui/core'
import { fakeDelay } from 'client/utils'

const useRequest = request => {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => () => { isMounted.current = false }, [])

  const doFetch = useCallback(
    debounce(payload =>
      request({ ...payload })
        .then(response => {
          if (isMounted.current) {
            if (response !== undefined) {
              setData(response)
              setError(false)
            } else setError(true)
          }
        })
        .catch(() => {
          if (isMounted.current) {
            setData(undefined)
            setError(true)
          }
        })
        .finally(() => {
          if (isMounted.current) {
            setLoading(false)
            setReloading(false)
          }
        })
    ), [isMounted])

  const fetchRequest = useCallback((payload, options = {}) => {
    const { reload = false, delay = 0 } = options
    if (!(Number.isInteger(delay) && delay >= 0)) {
      console.error(`
          Delay must be a number >= 0!
          If you're using it as a function, it must also return a number >= 0.`)
    }

    if (isMounted.current) {
      reload ? setReloading(true) : setLoading(true)
    }

    fakeDelay(delay).then(() => doFetch(payload))
  }, [isMounted])

  return {
    data,
    fetchRequest,
    loading,
    reloading,
    error
  }
}
export default useRequest
