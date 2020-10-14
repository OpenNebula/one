import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { fakeDelay } from 'client/utils/helpers'

function useList ({ list, initLength }) {
  const [fullList, setFullList] = useState([])
  const [shortList, setShortList] = useState([])
  const [finish, setFinish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingNextPage, setLoadingNextPage] = useState(false)
  const [length, setLength] = useState(initLength)

  useEffect(() => {
    /* FIRST TIME */
    if (list?.length === 0 || shortList.length !== 0) return

    setLoading(true)
    setFullList(list)
    setShortList(list.slice(0, initLength))
    setLoading(false)
  }, [list])

  useEffect(() => {
    /* SHOW NEXT PAGE */
    if (finish) return
    if (length === initLength) return

    setLoadingNextPage(true)

    fakeDelay(500)
      .then(() =>
        setShortList(prev => prev.concat(fullList.slice(prev.length, length)))
      )
      .then(() => setLoadingNextPage(false))
      .then(() => setFinish(shortList.length >= fullList.length))
  }, [length, setLength])

  const reset = newList => {
    /* RESET VALUES */
    setLength(initLength)
    setFullList(newList)
    setShortList(newList.slice(0, initLength))
    setFinish(newList.length < initLength)
  }

  return { loading, loadingNextPage, shortList, finish, reset, setLength }
}

useList.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  fetchList: PropTypes.func.isRequired,
  initLength: PropTypes.string
}

useList.defaultProps = {
  list: [],
  fetchList: () => undefined,
  initLength: 50
}

export default useList
