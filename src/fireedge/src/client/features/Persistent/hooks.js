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
/* eslint-disable jsdoc/require-jsdoc */
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import * as actions from 'client/features/Persistent/actions'
import { name as persistentSlice } from 'client/features/Persistent/slice'

export const usePersistent = () =>
  useSelector((state) => state[persistentSlice], shallowEqual)

export const usePersistentApi = () => {
  const dispatch = useDispatch()

  return {
    setUserInputSuggestionsVR: (UserInputSuggestions) =>
      dispatch(actions.setUserInputSuggestionsVR(UserInputSuggestions)),
    addUserInputSuggestionVR: (suggestion) =>
      dispatch(actions.addUserInputSuggestionVR(suggestion)),
    removeUserInputSuggestionVR: (text) =>
      dispatch(actions.removeUserInputSuggestionVR(text)),
  }
}
