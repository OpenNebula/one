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
import { createSlice } from '@reduxjs/toolkit'

import { APPS_IN_BETA, APPS_WITH_SWITCHER } from 'client/constants'
import { logout } from 'client/features/Auth/slice'
import * as actions from 'client/features/General/actions'
import { calculateIndex, generateKey } from 'client/utils'
import { parsePayload } from 'client/utils/parser'
import { cloneDeep, get, merge, pickBy, pullAt, set } from 'lodash'

const initial = {
  zone: 0,
  appTitle: null,
  isBeta: false,
  withGroupSwitcher: false,
  isLoading: false,
  isFixMenu: false,
  isUpdateDialog: false,
  upload: 0,
  notifications: [],
  selectedIds: [],
  disabledSteps: [],
  fieldPath: '',
  modifiedFields: {},
  defaultZone: 0,
}

const slice = createSlice({
  name: 'general',
  initialState: initial,
  extraReducers: (builder) => {
    builder
      /* LOGOUT ACTION */
      .addCase(logout, (state) => ({
        ...initial,
        // persistent app state
        zone: state.defaultZone,
        defaultZone: state.defaultZone,
        appTitle: state.appTitle,
        isBeta: state.isBeta,
        withGroupSwitcher: state.withGroupSwitcher,
      }))

      /* UI ACTIONS */
      .addCase(actions.fixMenu, (state, { payload }) => ({
        ...state,
        isFixMenu: !!payload,
      }))
      .addCase(actions.changeLoading, (state, { payload }) => ({
        ...state,
        isLoading: !!payload,
      }))
      .addCase(actions.changeAppTitle, (state, { payload: appTitle }) => {
        const lowerAppTitle = String(appTitle).toLowerCase()
        const isBeta = APPS_IN_BETA?.includes(lowerAppTitle)
        const withGroupSwitcher = APPS_WITH_SWITCHER?.includes(lowerAppTitle)

        return { ...state, appTitle, isBeta, withGroupSwitcher }
      })
      .addCase(actions.changeZone, (state, { payload }) => ({
        ...state,
        zone: payload,
      }))
      .addCase(actions.setSelectedIds, (state, { payload }) => {
        state.selectedIds = payload
      })
      .addCase(actions.updateDisabledSteps, (state, { payload }) => {
        state.disabledSteps = payload
      })
      .addCase(actions.setUpdateDialog, (state, { payload }) => {
        state.isUpdateDialog = !!payload
      })

      /* FIELD MODIFICATIONS */
      .addCase(actions.setFieldPath, (state, { payload }) => {
        state.fieldPath = payload
      })
      .addCase(actions.resetFieldPath, (state) => {
        state.fieldPath = ''
      })
      .addCase(actions.initModifiedFields, (state, { payload }) => {
        // Get field path and check if there is something in this path
        const fieldPath = state?.fieldPath || ''
        const exists = get(state.modifiedFields, fieldPath, false)

        // If the path has content, do nothing
        if (!exists) {
          set(state.modifiedFields, fieldPath, payload)
        }
      })
      .addCase(actions.changePositionModifiedFields, (state, { payload }) => {
        // Get from payload the path to the arrays and the number of the element
        const sourcePath = payload?.sourcePath
        const sourcePosition = payload?.sourcePosition
        const targetPath = payload?.targetPath
        const sourceDelete = payload?.sourceDelete
        const emptyObjectContent = payload?.emptyObjectContent
        const targetPosition = payload?.targetPosition

        // Get source element and change to target array and delete on source array
        const sourceArray = get(state.modifiedFields, sourcePath)
        const targetArray = get(state.modifiedFields, targetPath)

        const sourceIndex = calculateIndex(sourceArray, sourcePosition)
        const targetIndex = calculateIndex(targetArray, targetPosition)

        const sourceFinalPosition =
          sourceIndex === -1 ? sourceArray.length : sourceIndex
        const targetFinalPosition =
          targetIndex === -1 ? targetArray.length : targetIndex

        targetArray[targetFinalPosition] = sourceArray[sourceFinalPosition]

        sourceDelete && pullAt(sourceArray, sourceFinalPosition)
        emptyObjectContent &&
          (sourceArray[sourceFinalPosition] = pickBy(
            sourceArray[sourceFinalPosition],
            (value, key) => key.startsWith('__')
          ))

        set(state.modifiedFields, sourcePath, sourceArray)
        set(state.modifiedFields, targetPath, targetArray)
      })
      .addCase(actions.setModifiedFields, (state, { payload, meta }) => {
        // Get field path
        const fieldPath = state?.fieldPath || ''

        // Removes references
        const mergedPayload = cloneDeep(payload)

        if (fieldPath.length) {
          const pathSegments = fieldPath.split('.')
          const lastSegment = pathSegments.slice(-1)[0]
          const isArrayIndex = /^\d+$/.test(lastSegment)

          if (isArrayIndex) {
            const pathWithoutIndex = pathSegments.slice(0, -1).join('.')

            const arrayAtPath = get(state.modifiedFields, pathWithoutIndex, [])
            const index = parseInt(lastSegment, 10)
            while (arrayAtPath.length <= index) {
              arrayAtPath.push({})
            }
            if (payload?.__flag__ === 'DELETE') {
              // Filter the array to mark the correct position with delete
              arrayAtPath.filter((item) => !item.__delete__)[
                index
              ].__delete__ = true
            } else {
              // In array cases, we need to calculate the correction index (could exists elements that were deleted)
              const arrayWithoutDeleteItems = arrayAtPath.filter(
                (item) => !item.__delete__
              )
              const arrayWithoutDeleteItemsLength =
                arrayWithoutDeleteItems.length

              // Update original item
              if (index < arrayWithoutDeleteItemsLength) {
                arrayWithoutDeleteItems[index] = merge(
                  arrayWithoutDeleteItems[index] || {},
                  mergedPayload
                )
              } else {
                // Create new item
                arrayAtPath[arrayAtPath.length] = mergedPayload
              }
            }

            set(state.modifiedFields, pathWithoutIndex, arrayAtPath)
          } else {
            const nested = pathSegments?.length > 2
            const nestedBasePath = nested
              ? pathSegments.slice(0, -1).join('.')
              : pathSegments.join('.')
            const nestedKey = pathSegments.slice(-1)[0]

            let existingNestedValue = get(
              state.modifiedFields,
              nestedBasePath,
              {}
            )

            if (nested) {
              existingNestedValue[nestedKey] = merge(
                {},
                existingNestedValue || {},
                get(mergedPayload, pathSegments[0], {})
              )
            } else {
              existingNestedValue = merge(
                {},
                existingNestedValue || {},
                get(mergedPayload, pathSegments[0], {})
              )
            }

            const parsedExisting = parsePayload(existingNestedValue, fieldPath)
            set(state.modifiedFields, nestedBasePath, parsedExisting)
          }
        } else {
          state.modifiedFields = merge({}, state.modifiedFields, mergedPayload)
        }

        if (payload?.setPath) {
          state.fieldPath = payload.setPath
        }
      })
      .addCase(actions.resetModifiedFields, (state) => {
        state.modifiedFields = {}
      })

      /* UPLOAD NOTIFICATION */
      .addCase(actions.setUploadSnackbar, (state, { payload }) => ({
        ...state,
        upload: payload,
      }))
      /* NOTIFICATION ACTIONS */
      .addCase(actions.enqueueSnackbar, (state, { payload }) => {
        const { key, options, message, values } = payload

        return {
          ...state,
          notifications: [
            ...state.notifications,
            { key, options, message, values },
          ],
        }
      })
      .addCase(actions.dismissSnackbar, (state, { payload }) => {
        const { key, dismissAll } = payload

        return {
          ...state,
          notifications: state.notifications.map((notification) =>
            dismissAll || notification.key !== key
              ? { ...notification, dismissed: true }
              : { ...notification }
          ),
        }
      })
      .addCase(actions.deleteSnackbar, (state, { payload }) => {
        const { key } = payload

        return {
          ...state,
          notifications: state.notifications.filter(
            (notification) => notification.key !== key
          ),
        }
      })

      /*  REQUESTS API MATCHES */
      .addMatcher(
        ({ type }) => type.endsWith('/pending') && !type.includes('auth'),
        (state) => ({ ...state, isLoading: true })
      )
      .addMatcher(
        ({ type }) => type.endsWith('/fulfilled') && !type.includes('auth'),
        (state) => ({ ...state, isLoading: false })
      )
      .addMatcher(
        ({ type, meta }) =>
          !meta?.aborted &&
          type.endsWith('/rejected') &&
          !type.includes('auth'),
        (state, { payload }) => ({
          ...state,
          isLoading: false,
          notifications: [
            ...state.notifications,
            payload?.length > 0 && {
              key: generateKey(),
              message: payload,
              options: { variant: 'error' },
            },
          ].filter(Boolean),
        })
      )
  },
})

export const { name, reducer } = slice
