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
import { createApi } from '@reduxjs/toolkit/query/react'

import { enqueueSnackbar } from '@modules/features/General/actions'
import { http, generateKey, requestConfig, formatError } from '@UtilsModule'
import { httpCodes } from 'server/utils/constants'
import {
  DOCUMENT,
  DOCUMENT_POOL,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  PROVISION_CONFIG,
  PROVISION_RESOURCES,
} from '@modules/features/OneApi/resources'

const oneApi = createApi({
  reducerPath: 'oneApi',
  baseQuery: async (
    { params = {}, command, needStateInMeta = false, showNotification = true },
    { getState, dispatch, signal }
  ) => {
    const paramsExtensible = { ...params }

    try {
      // set filter flag if filter is present in command params
      if (!paramsExtensible?.filter && command?.params?.filter) {
        paramsExtensible.filter = getState().auth?.filterPool
      }

      const config = requestConfig(paramsExtensible, command, {
        selectedZone: getState().general?.zone,
        defaultZone: getState().general?.defaultZone,
      })
      const response = await http.request({ ...config, signal })
      const state = needStateInMeta ? getState() : {}

      return { data: response.data ?? {}, meta: { state } }
    } catch (axiosError) {
      const { message, data = {}, status, statusText } = axiosError
      const { message: messageFromServer, data: errorFromOned } = data

      const error =
        message ??
        formatError(errorFromOned?.type, { fallback: errorFromOned }) ??
        messageFromServer ??
        statusText
      if (status === 204) {
        const state = needStateInMeta ? getState() : {}

        return { data: {}, meta: { state } } // 204 returns no data so we need to explicitly mark this as a success
      }

      status !== httpCodes.unauthorized.id &&
        showNotification &&
        dispatch(
          enqueueSnackbar({
            key: generateKey(),
            message: error,
            options: { variant: 'error' },
          })
        )

      return { error: { status: status, data: error } }
    }
  },
  refetchOnMountOrArgChange: 30,
  tagTypes: [
    ...Object.values(ONE_RESOURCES),
    ...Object.values(ONE_RESOURCES_POOL),
    ...Object.values(DOCUMENT),
    ...Object.values(DOCUMENT_POOL),
    ...Object.values(PROVISION_CONFIG),
    ...Object.values(PROVISION_RESOURCES),
  ],
  endpoints: () => ({}),
})

export {
  DOCUMENT,
  DOCUMENT_POOL,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  PROVISION_CONFIG,
  PROVISION_RESOURCES,
  oneApi,
}
