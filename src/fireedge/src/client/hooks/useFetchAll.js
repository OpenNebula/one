import { useState, useCallback, useEffect, useRef } from 'react'
import { debounce } from '@material-ui/core'
import { fakeDelay } from 'client/utils'

const useRequestAll = () => {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => () => { isMounted.current = false }, [])

  const doFetchs = useCallback(
    debounce((requests, onError) =>
      Promise
        .all(requests)
        .then(response => {
          if (isMounted.current) {
            if (response !== undefined) {
              setData(response)
              setError(false)
            } else setError(true)

            isMounted.current && setLoading(false)
            isMounted.current && setReloading(false)
          }
          // }).catch(onError)
        }).catch(err => {
          setError(true)
          onError?.(err)
        })
    ), [isMounted])

  const fetchRequestAll = useCallback((requests, options = {}) => {
    const { reload = false, delay = 0, onError } = options
    if (!(Number.isInteger(delay) && delay >= 0)) {
      console.error(`
          Delay must be a number >= 0!
          If you're using it as a function, it must also return a number >= 0.`)
    }

    if (isMounted.current) {
      reload ? setReloading(true) : setLoading(true)
    }

    fakeDelay(delay).then(() => doFetchs(requests, onError))
  }, [isMounted])

  return {
    data,
    fetchRequestAll,
    loading,
    reloading,
    error
  }
}
export default useRequestAll
