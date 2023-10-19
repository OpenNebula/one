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
/* eslint-disable jsdoc/require-jsdoc */
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import * as actions from 'client/features/General/actions'
import { name as generalSlice } from 'client/features/General/slice'
import { generateKey } from 'client/utils'

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
    enqueueSuccess: (message) =>
      dispatch(
        actions.enqueueSnackbar({
          key: generateKey(),
          message,
          options: { variant: 'success' },
        })
      ),
    enqueueError: (message) =>
      dispatch(
        actions.enqueueSnackbar({
          key: generateKey(),
          message,
          options: { variant: 'error' },
        })
      ),
    enqueueInfo: (message) =>
      dispatch(
        actions.enqueueSnackbar({
          key: generateKey(),
          message,
          options: { variant: 'info' },
        })
      ),
  }
}
