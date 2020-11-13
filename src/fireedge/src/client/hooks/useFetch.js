import { useState, useCallback } from 'react'

const useRequest = request => {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState(false)

  const callRequest = useCallback(
    payload =>
      request(payload)
        .then(response => {
          if (response !== undefined) {
            setData(response)
            setError(false)
          } else setError(true)
        }
        )
        .finally(() => {
          setLoading(false)
          setReloading(false)
        }),
    [request]
  )

  const fetchRequest = useCallback((payload, reload = false) => {
    reload ? setReloading(true) : setLoading(true)
    callRequest(payload)
  }, [])

  return { data, fetchRequest, loading, reloading, error }
}
export default useRequest
