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
import root from 'window-or-global'

/**
 * Save an item in the browser storage.
 *
 * @param {string} name - Name of item in the storage
 * @param {string} data - The data will be saved into local storage
 */
export const storage = (name = '', data = '') => {
  name && data && root?.localStorage?.setItem(name, data)
}

/**
 * Remove group of items from the browser storage.
 *
 * @param {string[]} items - List of item names
 */
export const removeStoreData = (items = []) => {
  const itemsToRemove = !Array.isArray(items) ? [items] : items

  itemsToRemove.forEach((item) => {
    root?.localStorage?.removeItem(item)
  })
}

/**
 * Looking for an item in the browser storage.
 *
 * @param {string} name - Name of item
 * @returns {false|string} Returns the item if found it
 */
export const findStorageData = (name = '') => {
  if (name && root?.localStorage?.getItem(name)) {
    return root.localStorage.getItem(name)
  } else return false
}

/**
 * Use external Token.
 *
 * @returns {string} Returns JWT from URL
 */
export const findExternalToken = () => {
  try {
    const searchParams = new URL(root?.location?.href)?.searchParams

    return searchParams.get('externalToken')
  } catch (error) {}
}
