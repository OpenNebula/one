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
import { useCallback, useRef } from 'react'

/**
 * Helps avoid a lot of potential memory leaks.
 *
 * @param {object} obj - Instance object
 * @returns {function():object} - Returns the last object
 */
export const useGetLatest = (obj) => {
  const ref = useRef()
  ref.current = obj

  return useCallback(() => ref.current, [])
}

/**
 * Assign the plugin state to the previous state.
 *
 * @param {object} prevState - Previous state
 * @param {function():object} plugin - Plugin
 * @returns {object} Returns the new state
 */
export const reducePlugin = (prevState, plugin = () => ({})) => ({
  ...prevState,
  ...plugin(prevState),
})
