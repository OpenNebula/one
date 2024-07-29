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
import { createAction } from '@reduxjs/toolkit'

export const fixMenu = createAction('Fix menu')
export const changeZone = createAction('Change zone')
export const changeLoading = createAction('Change loading')
export const changeAppTitle = createAction('Change App title')
export const setSelectedIds = createAction('Set selected IDs')
export const setUpdateDialog = createAction('Set update dialog')

export const updateDisabledSteps = createAction('Set disabled steps')
export const dismissSnackbar = createAction('Dismiss snackbar')
export const deleteSnackbar = createAction('Delete snackbar')
export const setUploadSnackbar = createAction('Change upload snackbar')
export const setFieldPath = createAction('Set dynamic field path')
export const resetFieldPath = createAction('Reset field path')
export const initModifiedFields = createAction('Init modified fields')
export const changePositionModifiedFields = createAction(
  'Change position of two array elements in modified fields'
)
export const setModifiedFields = createAction(
  'Set modified fields',
  (fields, options = {}) => ({
    payload: fields,
    meta: { batch: options.batch || false },
  })
)
export const resetModifiedFields = createAction('Reset modified fields')

export const enqueueSnackbar = createAction(
  'Enqueue snackbar',
  (payload = {}) => {
    if (payload?.message?.length > 0) return { payload }
  }
)
