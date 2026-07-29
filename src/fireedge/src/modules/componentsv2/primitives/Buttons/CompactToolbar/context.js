/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { createContext, useContext, useLayoutEffect, useRef } from 'react'

export const CompactToolbarContext = createContext(null)

let actionIdCounter = 0

/**
 * Returns a stable id without relying on React 18 useId.
 *
 * @param {string} prefix - Id prefix.
 * @returns {string} Stable id.
 */
export const useCompactToolbarId = (prefix = 'compact-action') => {
  const idRef = useRef(null)

  if (!idRef.current) {
    actionIdCounter += 1
    idRef.current = `${prefix}-${actionIdCounter}`
  }

  return idRef.current
}

const toMenuOption = ({
  title,
  text,
  tooltip,
  placeholder,
  startIcon,
  iconOnly,
  isDisabled,
  isDestructive,
  isSelected,
  onClick,
  options,
  sx,
} = {}) => ({
  title: title || text || tooltip || placeholder,
  startIcon: options ? undefined : startIcon ?? iconOnly,
  isDisabled,
  isDestructive,
  isSelected,
  onClick,
  options,
  sx,
})

/**
 * Registers an inline toolbar action and reports whether it should render in overflow.
 *
 * @param {string} id - Stable action id.
 * @param {object} option - Action metadata.
 * @param {boolean} compactable - Whether the action can move to overflow.
 * @returns {boolean} True when the inline action is compacted.
 */
export const useCompactToolbarAction = (id, option, compactable = false) => {
  const context = useContext(CompactToolbarContext)
  const registerAction = context?.registerAction
  const updateAction = context?.updateAction

  useLayoutEffect(() => {
    if (!registerAction || !compactable || !id) return undefined

    return registerAction(id)
  }, [compactable, id, registerAction])

  useLayoutEffect(() => {
    if (!updateAction || !compactable || !id) return

    updateAction(id, toMenuOption(option))
  }, [compactable, id, option, updateAction])

  return !!(compactable && context?.isCompacted(id))
}
