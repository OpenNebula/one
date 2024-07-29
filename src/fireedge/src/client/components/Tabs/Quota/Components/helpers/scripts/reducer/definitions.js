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
export const initialState = {
  globalIds: [],
  markedForDeletion: [],
  selectedIdentifier: '',
  globalValue: '',
  values: {},
  isValid: true,
  isApplyDisabled: true,
}

/**
 * @param {object} state - State variable.
 * @param {object} action - Action object.
 * @returns {object} - New state
 */
export const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_GLOBAL_IDS':
      return { ...state, globalIds: action.payload }
    case 'SET_SELECTED_IDENTIFIER':
      return { ...state, selectedIdentifier: action.payload }
    case 'SET_GLOBAL_VALUE':
      return { ...state, globalValue: action.payload }
    case 'SET_IS_VALID':
      return { ...state, isValid: action.payload }
    case 'SET_IS_APPLY_DISABLED':
      return { ...state, isApplyDisabled: action.payload }
    case 'SET_VALUES':
      return { ...state, values: action.payload }
    case 'MARK_FOR_DELETION':
      return {
        ...state,
        markedForDeletion: [...state.markedForDeletion, action.payload],
      }
    case 'UNMARK_FOR_DELETION':
      return {
        ...state,
        markedForDeletion: state.markedForDeletion.filter(
          (id) => id !== action.payload
        ),
      }

    default:
      return state
  }
}
