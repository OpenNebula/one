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

import * as actions from '@modules/features/Modals/actions'
import { ModalsSlice } from '@modules/features/Modals/slice'

const { name: modalsSlice } = ModalsSlice

export const useModals = () =>
  useSelector((state) => state[modalsSlice], shallowEqual)

export const useModalsApi = () => {
  const dispatch = useDispatch()

  return {
    showModal: (modal) => dispatch(actions.showModal(modal)),
    hideModal: (id) => dispatch(actions.hideModal(id)),
  }
}
