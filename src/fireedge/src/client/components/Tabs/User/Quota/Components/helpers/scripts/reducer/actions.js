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
/**
 * Action creator for setting global IDs in the state. The action contains the new globalIds to be set.
 *
 * @param {number[]|string[]} globalIds - The new array of global IDs to be updated in the state.
 * @returns {{ type: string, payload: number[]|string[] }} The action object to dispatch.
 */
export const setGlobalIds = (globalIds) => ({
  type: 'SET_GLOBAL_IDS',
  payload: globalIds,
})

/**
 * Action creator for setting the selected identifier in the state. The action contains the selectedIdentifier to be set.
 *
 * @param {number|string} selectedIdentifier - The identifier that has been selected.
 * @returns {{ type: string, payload: number|string }} The action object to dispatch.
 */
export const setSelectedIdentifier = (selectedIdentifier) => ({
  type: 'SET_SELECTED_IDENTIFIER',
  payload: selectedIdentifier,
})

/**
 * Action creator for setting a global value in the state. The action contains the globalValue to be set.
 *
 * @param {any} globalValue - The new value to update in the state.
 * @returns {{ type: string, payload: any }} The action object to dispatch.
 */
export const setGlobalValue = (globalValue) => ({
  type: 'SET_GLOBAL_VALUE',
  payload: globalValue,
})

/**
 * Action creator for setting multiple values in the state at once. The action contains the values object to be set.
 *
 * @param {object} values - An object containing multiple values to update in the state.
 * @returns {{type: string, payload: object}} The action object to dispatch.
 */
export const setValues = (values) => ({ type: 'SET_VALUES', payload: values })

/**
 * Action creator to mark a resource ID for deletion in the state.
 *
 * @param {number|string} resourceId - The ID of the resource to be marked for deletion.
 * @returns {{ type: string, payload: number|string }} The action object to dispatch.
 */
export const setMarkForDeletion = (resourceId) => ({
  type: 'MARK_FOR_DELETION',
  payload: resourceId,
})

/**
 * Action creator to unmark a resource ID from being marked for deletion in the state.
 *
 * @param {number|string} resourceId - The ID of the resource to unmark for deletion.
 * @returns {{ type: string, payload: number|string }} The action object to dispatch.
 */
export const setUnmarkForDeletion = (resourceId) => ({
  type: 'UNMARK_FOR_DELETION',
  payload: resourceId,
})

/**
 * Action creator for setting the 'isValid' flag in the state, indicating whether the current state is valid or not.
 *
 * @param {boolean} isValid - Boolean flag indicating the validity of the state.
 * @returns {{ type: string, payload: boolean }} The action object to dispatch.
 */
export const setIsValid = (isValid) => ({
  type: 'SET_IS_VALID',
  payload: isValid,
})

/**
 * Action creator for setting the 'isApplyDisabled' flag in the state, which controls whether the apply action is disabled.
 *
 * @param {boolean} isDisabled - Boolean flag indicating if the apply action should be disabled.
 * @returns {{ type: string, payload: boolean }} The action object to dispatch.
 */
export const setIsApplyDisabled = (isDisabled) => ({
  type: 'SET_IS_APPLY_DISABLED',
  payload: isDisabled,
})
