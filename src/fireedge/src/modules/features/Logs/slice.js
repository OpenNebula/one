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
// src/features/logs/logsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Async thunk to fetch all logs
export const fetchLogs = createAsyncThunk('logs/fetchLogs', async () => {
  const response = await axios.get('/api/logs') // Adjust endpoint

  return response.data.data.lines // Assuming your API response structure
})

const logsSlice = createSlice({
  name: 'logs',
  initialState: {
    allLogs: [],
    filteredLogs: [],
    status: 'idle',
    error: null,
    levelFilter: 'all',
    searchText: '',
  },
  reducers: {
    setLogs(state, { payload }) {
      state.allLogs = payload
    },
    setLevelFilter(state, action) {
      state.levelFilter = action.payload
      state.filteredLogs = filterLogs(
        state.allLogs,
        state.levelFilter,
        state.searchText
      )
    },
    setSearchText(state, action) {
      state.searchText = action.payload
      state.filteredLogs = filterLogs(
        state.allLogs,
        state.levelFilter,
        state.searchText
      )
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogs.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.allLogs = action.payload
        state.filteredLogs = filterLogs(
          action.payload,
          state.levelFilter,
          state.searchText
        )
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  },
})

function filterLogs(logs, level, searchText) {
  return logs.filter((log) =>
    log?.text?.toLowerCase().includes(searchText?.toLowerCase())
  )
}

export const { setLevelFilter, setSearchText, setLogs } = logsSlice.actions

export { logsSlice as LogsSlice }
