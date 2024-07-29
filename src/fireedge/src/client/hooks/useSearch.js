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
import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'

/**
 * @typedef {object} useSearchHook
 * @property {string} query - Search term
 * @property {Array} result - Result of the search
 * @property {Function} handleChange - Function to handle the change event
 */

/**
 * Hook to manage a search in a list.
 *
 * @param {object} params - Search parameters
 * @param {Array} params.list - List of elements
 * @param {Fuse.IFuseOptions} [params.listOptions] - Search options
 * @param {number} [params.wait] - Wait a certain amount of time before searching again. By default 1 second
 * @param {boolean} [params.condition] - Search if the condition is true
 * @returns {useSearchHook} - Returns information about the search
 */
const useSearch = ({ list, listOptions, wait, condition }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [result, setResult] = useState(undefined)
  const debouncedSearchTerm = useDebounce(searchTerm, wait, condition)

  const listFuse = useMemo(() => {
    const indexed = listOptions?.keys
      ? Fuse.createIndex(listOptions.keys, list)
      : undefined

    return new Fuse(list, listOptions, indexed)
  }, [list, listOptions])

  useEffect(() => {
    const search = debouncedSearchTerm
      ? listFuse.search(debouncedSearchTerm).map(({ item }) => item)
      : undefined

    setResult(search)
  }, [debouncedSearchTerm])

  return {
    query: searchTerm,
    result: result ?? list,
    handleChange: (evt) => setSearchTerm(evt?.target?.value),
  }
}

/**
 * This hook allows you to debounce any fast changing value.
 * The debounced value will only reflect the latest value when
 * the useDebounce hook has not been called for the specified time period.
 *
 * @param {string} value - Value to debounce
 * @param {number} [delay] - Delay in milliseconds
 * @param {boolean} [condition] - Condition to check if the value should be debounced
 * @returns {string} Debounced value
 */
const useDebounce = (value, delay = 1000, condition = true) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      condition && setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay, condition])

  return debouncedValue
}

export default useSearch
