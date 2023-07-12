/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { createAction } from '@reduxjs/toolkit'

export const fixMenu = createAction('Fix menu')
export const changeZone = createAction('Change zone')
export const changeLoading = createAction('Change loading')
export const changeAppTitle = createAction('Change App title')
export const setSelectedIds = createAction('Set selected IDs')

export const updateDisabledSteps = createAction('Set disabled steps')
export const dismissSnackbar = createAction('Dismiss snackbar')
export const deleteSnackbar = createAction('Delete snackbar')
export const setUploadSnackbar = createAction('Change upload snackbar')

export const enqueueSnackbar = createAction(
  'Enqueue snackbar',
  (payload = {}) => {
    if (payload?.message?.length > 0) return { payload }
  }
)
