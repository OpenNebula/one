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
/* eslint-disable jsdoc/require-jsdoc */
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import * as actions from '@modules/features/General/actions'
import { GeneralSlice } from '@modules/features/General/slice'
import { generateKey } from '@UtilsModule'

const { name: generalSlice } = GeneralSlice

export const useGeneral = () =>
  useSelector((state) => state[generalSlice], shallowEqual)

export const useGeneralApi = () => {
  const dispatch = useDispatch()

  return {
    fixMenu: (isFixed) => dispatch(actions.fixMenu(isFixed)),
    changeLoading: (isLoading) => dispatch(actions.changeLoading(isLoading)),
    changeAppTitle: (appTitle) => dispatch(actions.changeAppTitle(appTitle)),
    changeZone: (zone) => dispatch(actions.changeZone(zone)),
    uploadSnackbar: (percent) => dispatch(actions.setUploadSnackbar(percent)),
    setUpdateDialog: (updateDialog) =>
      dispatch(actions.setUpdateDialog(updateDialog)),
    setFullMode: (fullMode) => dispatch(actions.setFullMode(fullMode)),
    setBreadcrumb: (breadcrumb) => dispatch(actions.setBreadcrumb(breadcrumb)),
    setTableViewMode: (tableViewMode) =>
      dispatch(actions.setTableViewMode(tableViewMode)),

    // modified fields
    setFieldPath: (path) => dispatch(actions.setFieldPath(path)),
    resetFieldPath: () => dispatch(actions.resetFieldPath()),
    initModifiedFields: (fields) =>
      dispatch(actions.initModifiedFields(fields)),
    changePositionModifiedFields: (fields) =>
      dispatch(actions.changePositionModifiedFields(fields)),
    setModifiedFields: (fields, options = {}) => {
      dispatch(actions.setModifiedFields(fields, options))
    },
    resetModifiedFields: () => dispatch(actions.resetModifiedFields()),

    useLoadOsProfile: (stepId) => {
      dispatch(actions.setLoadOsProfile(stepId))
    },

    useResetLoadOsProfile: () => {
      dispatch(actions.resetLoadOsProfile())
    },

    // dismiss all if no key has been defined
    dismissSnackbar: (key) =>
      dispatch(actions.dismissSnackbar({ key, dismissAll: !key })),
    deleteSnackbar: (key) => dispatch(actions.deleteSnackbar({ key })),

    enqueueSnackbar: ({ message, options = {} } = {}) =>
      dispatch(
        actions.enqueueSnackbar({
          key: generateKey(),
          message,
          options,
        })
      ),
    enqueueSuccess: (message, values) =>
      dispatch(
        actions.enqueueSnackbar({
          key: generateKey(),
          message,
          values,
          options: { variant: 'success' },
        })
      ),
    enqueueError: (message, values) =>
      dispatch(
        actions.enqueueSnackbar({
          key: generateKey(),
          message,
          values,
          options: { variant: 'error' },
        })
      ),
    enqueueInfo: (message, values) =>
      dispatch(
        actions.enqueueSnackbar({
          key: generateKey(),
          message,
          values,
          options: { variant: 'info' },
        })
      ),
  }
}
