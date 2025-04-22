/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { RefObject, useEffect, useRef, useCallback } from 'react'
import { debounce } from 'lodash'

/**
 * Attaches a debounced ResizeObserver to a given element reference and runs a callback on resize.
 *
 * @param {RefObject} targetRef - The ref to observe
 * @param {Function} callback - The function to execute on resize events
 * @param {number} delay - debounce delay in milliseconds for the callback
 */
const useResizeObserver = (targetRef, callback, delay = 300) => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallbackExecutor = useCallback((entries) => {
    const entry = entries[0]
    if (entry && callbackRef.current) {
      callbackRef.current(entry)
    }
  }, [])

  const latestDebouncedFn = useRef(null)

  useEffect(() => {
    latestDebouncedFn.current = debounce(debouncedCallbackExecutor, delay)

    return () => {
      latestDebouncedFn.current?.cancel()
    }
  }, [delay, debouncedCallbackExecutor])

  useEffect(() => {
    if (!targetRef.current || !(targetRef.current instanceof Element)) {
      return
    }

    const currentDebouncedFn = latestDebouncedFn.current
    if (!currentDebouncedFn) {
      return
    }

    const observer = new ResizeObserver(currentDebouncedFn)

    observer.observe(targetRef.current)

    return () => {
      observer.disconnect()
    }
  }, [targetRef])

  useEffect(
    () => () => {
      latestDebouncedFn.current?.cancel()
    },
    []
  )
}

export default useResizeObserver
