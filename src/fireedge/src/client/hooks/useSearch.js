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
import { useState, useMemo, useCallback } from 'react'

import { debounce } from '@mui/material'
import Fuse from 'fuse.js'

/**
 * Hook to manage a search in a list.
 *
 * @param {object} params - Search parameters
 * @param {Array} params.list - List of elements
 * @param {Fuse.IFuseOptions} params.listOptions - Search options
 * @returns {{
 * query: string,
 * result: Array,
 * handleChange: Function
 * }} - Returns information about the search
 */
const useSearch = ({ list, listOptions }) => {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(undefined)

  const listFuse = useMemo(
    () => new Fuse(list, listOptions, Fuse.createIndex(listOptions?.keys, list)),
    [list, listOptions]
  )

  const debounceResult = useCallback(
    debounce(value => {
      const search = listFuse.search(value)?.map(({ item }) => item)

      setResult(value ? search : undefined)
    }, 1000),
    [list]
  )

  const handleChange = event => {
    const { value: nextValue } = event?.target

    setQuery(nextValue)
    debounceResult(nextValue)
  }

  return { query, result, handleChange }
}

export default useSearch
