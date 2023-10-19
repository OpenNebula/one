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
import { createApi } from '@reduxjs/toolkit/query/react'

import { enqueueSnackbar } from 'client/features/General/actions'
import { generateKey, requestConfig } from 'client/utils'
import http from 'client/utils/rest'
import { httpCodes } from 'server/utils/constants'

const ONE_RESOURCES = {
  ACL: 'ACL',
  APP: 'APP',
  CLUSTER: 'CLUSTER',
  DATASTORE: 'DATASTORE',
  FILE: 'FILE',
  GROUP: 'GROUP',
  HOST: 'HOST',
  IMAGE: 'IMAGE',
  MARKETPLACE: 'MARKET',
  SECURITYGROUP: 'SECGROUP',
  SYSTEM: 'SYSTEM',
  TEMPLATE: 'TEMPLATE',
  USER: 'USER',
  VDC: 'VDC',
  VM: 'VM',
  VMGROUP: 'VM_GROUP',
  VNET: 'VNET',
  VNTEMPLATE: 'VNTEMPLATE',
  VROUTER: 'VROUTER',
  ZONE: 'ZONE',
}

const ONE_RESOURCES_POOL = Object.entries(ONE_RESOURCES).reduce(
  (pools, [key, value]) => ({ ...pools, [`${key}_POOL`]: `${value}_POOL` }),
  {}
)

const DOCUMENT = {
  SERVICE: 'SERVICE',
  SERVICE_TEMPLATE: 'SERVICE_TEMPLATE',
  PROVISION: 'PROVISION',
  PROVIDER: 'PROVIDER',
}

const DOCUMENT_POOL = Object.entries(DOCUMENT).reduce(
  (pools, [key, value]) => ({ ...pools, [`${key}_POOL`]: `${value}_POOL` }),
  {}
)

const PROVISION_CONFIG = {
  PROVISION_DEFAULTS: 'PROVISION_DEFAULTS',
  PROVIDER_CONFIG: 'PROVIDER_CONFIG',
}

const PROVISION_RESOURCES = {
  CLUSTER: 'PROVISION_CLUSTER',
  DATASTORE: 'PROVISION_DATASTORE',
  HOST: 'PROVISION_HOST',
  TEMPLATE: 'PROVISION_VMTEMPLATE',
  IMAGE: 'PROVISION_IMAGE',
  NETWORK: 'PROVISION_VNET',
  VNTEMPLATE: 'PROVISION_VNTEMPLATE',
  FLOWTEMPLATE: 'PROVISION_FLOWTEMPLATE',
}

const oneApi = createApi({
  reducerPath: 'oneApi',
  baseQuery: async (
    { params = {}, command, needStateInMeta = false },
    { getState, dispatch, signal }
  ) => {
    const paramsExtensible = { ...params }

    try {
      // set filter flag if filter is present in command params
      if (command?.params?.filter) {
        paramsExtensible.filter = getState().auth?.filterPool
      }

      const config = requestConfig(paramsExtensible, command)
      const response = await http.request({ ...config, signal })
      const state = needStateInMeta ? getState() : {}

      return { data: response.data ?? {}, meta: { state } }
    } catch (axiosError) {
      const { message, data = {}, status, statusText } = axiosError
      const { message: messageFromServer, data: errorFromOned } = data

      const error = message ?? errorFromOned ?? messageFromServer ?? statusText
      if (status === 204) {
        const state = needStateInMeta ? getState() : {}

        return { data: {}, meta: { state } } // 204 returns no data so we need to explicitly mark this as a success
      }
      status !== httpCodes.unauthorized.id &&
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
