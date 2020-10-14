import { useState, useCallback } from 'react'

const useRequest = request => {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchRequest = useCallback(
    payload => {
      let ignore = false
      setLoading(true)
      setError(false)

      request(payload)
        .then(response => {
          if (response !== undefined && !ignore) {
            setData(response)
          } else {
            setError(true)
          }
        })
        .finally(() => {
          setLoading(false)
        })

      return () => {
        ignore = true
      }
    },
    [request]
  )

  return { data, fetchRequest, loading, error }
}
export default useRequest
