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
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { fakeDelay } from 'client/utils'

/**
 * Hook to manage an infinite list.
 * TODO: Make the hook with a reducer.
 *
 * @param {object} props - Props
 * @param {Array} props.list - List of elements
 * @param {number} [props.initLength=50] - Initial length of the list
 * @returns {{
 * loading: boolean,
 * loadingNextPage: boolean,
 * shortList: Array,
 * finish: boolean,
 * reset: Function,
 * setLength: Function
 * }} - Properties to manage the infinite list
 */
const useList = ({ list, initLength }) => {
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
        setShortList((prev) => prev.concat(fullList.slice(prev.length, length)))
      )
      .then(() => setLoadingNextPage(false))
      .then(() => setFinish(shortList.length >= fullList.length))
  }, [length, setLength])

  const reset = (newList) => {
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
  initLength: PropTypes.string,
}

useList.defaultProps = {
  list: [],
  initLength: 50,
}

export default useList
