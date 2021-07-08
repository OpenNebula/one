/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useDispatch, useSelector } from 'react-redux'

import * as actions from 'client/features/General/actions'
import { generateKey } from 'client/utils'

export const useGeneral = () => (
  useSelector(state => state.general)
)

export const useGeneralApi = () => {
  const dispatch = useDispatch()

  return {
    fixMenu: isFixed => dispatch(actions.fixMenu(isFixed)),
    changeLoading: isLoading => dispatch(actions.changeLoading(isLoading)),
    changeTitle: title => dispatch(actions.changeTitle(title)),
    changeZone: zone => dispatch(actions.changeZone(zone)),

    // dismiss all if no key has been defined
    dismissSnackbar: key => dispatch(
      actions.dismissSnackbar({ key, dismissAll: !key })
    ),
    deleteSnackbar: key => dispatch(
      actions.deleteSnackbar({ key })
    ),

    enqueueSnackbar: ({ message, options = {} } = {}) => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options
      })
    ),
    enqueueSuccess: message => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options: { variant: 'success' }
      })
    ),
    enqueueError: message => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options: { variant: 'error' }
      })
    ),
    enqueueInfo: message => dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message,
        options: { variant: 'info' }
      })
    )
  }
}
