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
import * as actions from '@modules/features/Modals/actions'

const initial = {
  modals: [],
}

const slice = createSlice({
  name: 'modals',
  initialState: initial,
  extraReducers: (builder) => {
    builder
      .addCase(actions.showModal, (state, { payload }) => {
        state.modals.push(payload)
      })
      .addCase(actions.hideModal, (state, { payload: id }) => {
        state.modals = state.modals?.filter((modal) => modal?.id !== id)
      })
  },
})

export { slice as ModalsSlice }
