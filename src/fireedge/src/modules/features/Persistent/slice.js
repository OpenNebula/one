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
import { createSlice } from '@reduxjs/toolkit'

import * as actions from '@modules/features/Persistent/actions'

const initial = {
  userInputSuggestionsVR: [],
}

const slice = createSlice({
  name: 'persistent',
  initialState: initial,
  extraReducers: (builder) => {
    builder
      .addCase(actions.setUserInputSuggestionsVR, (state, { payload }) => {
        state.userInputSuggestionsVR = payload
      })
      .addCase(actions.addUserInputSuggestionVR, (state, { payload }) => {
        state.userInputSuggestionsVR.push(payload)
      })
      .addCase(
        actions.removeUserInputSuggestionVR,
        (state, { payload: text }) => {
          state.userInputSuggestionsVR = state.userInputSuggestionsVR.filter(
            (item) => item.text !== text
          )
        }
      )
  },
})

export { slice as PersistentSlice }
