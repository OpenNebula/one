import { useState, useCallback } from 'react'
import axios from 'axios'

const useRequest = request => {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState(false)
  const source = axios.CancelToken.source()

  const fetchRequest = useCallback((payload, reload = false) => {
    reload ? setReloading(true) : setLoading(true)

    request({
      ...payload,
      config: { cancelToken: source.token }
    }).then(response => {
      if (!axios.isCancel(response)) {
        if (response !== undefined) {
          setData(response)
          setError(false)
        } else setError(true)

        setLoading(false)
        setReloading(false)
      }
    })
  }, [source])

  return {
    data,
    fetchRequest,
    cancelRequest: source.cancel,
    loading,
    reloading,
    error
  }
}
export default useRequest
