import { useState, useCallback } from 'react'

const useRequestAll = () => {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchRequestAll = useCallback(
    requests => {
      setLoading(true)
      setError(false)

      Promise
        .all(requests)
        .then(response => {
          if (response !== undefined) setData(response)
          else setError(true)
        })
        .finally(() => { setLoading(false) })
    },
    []
  )

  return { data, fetchRequestAll, loading, error }
}
export default useRequestAll
