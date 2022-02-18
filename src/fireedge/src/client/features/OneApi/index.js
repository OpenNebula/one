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
import { createApi } from '@reduxjs/toolkit/query/react'

import { enqueueSnackbar } from 'client/features/General/actions'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, generateKey } from 'client/utils'
import http from 'client/utils/rest'

const ONE_RESOURCES = {
  ACL: 'Acl',
  APP: 'App',
  CLUSTER: 'Cluster',
  DATASTORE: 'Datastore',
  FILE: 'File',
  GROUP: 'Group',
  HOST: 'Host',
  IMAGE: 'Image',
  MARKETPLACE: 'Marketplace',
  SECURITYGROUP: 'SecurityGroup',
  SYSTEM: 'System',
  TEMPLATE: 'Template',
  USER: 'User',
  VDC: 'Vdc',
  VM: 'Vm',
  VMGROUP: 'VmGroup',
  VNET: 'VNetwork',
  VNTEMPLATE: 'NetworkTemplate',
  VROUTER: 'VirtualRouter',
  ZONE: 'Zone',
}

const ONE_RESOURCES_POOL = Object.entries(ONE_RESOURCES).reduce(
  (pools, [key, value]) => ({ ...pools, [`${key}_POOL`]: `${value}_POOL` }),
  {}
)

const DOCUMENT = {
  SERVICE: 'applicationService',
  SERVICE_TEMPLATE: 'applicationServiceTemplate',
  PROVISION: 'provision',
  PROVIDER: 'provider',
}

const DOCUMENT_POOL = Object.entries(DOCUMENT).reduce(
  (pools, [key, value]) => ({ ...pools, [`${key}_POOL`]: `${value}_POOL` }),
  {}
)

const PROVISION_CONFIG = {
  PROVISION_DEFAULTS: 'provisionDefaults',
  PROVIDER_CONFIG: 'providerConfig',
}

const PROVISION_RESOURCES = {
  CLUSTER: 'provisionCluster',
  DATASTORE: 'provisionDatastore',
  HOST: 'provisionHost',
  TEMPLATE: 'provisionVmTemplate',
  IMAGE: 'provisionImage',
  NETWORK: 'provisionVNetwork',
  VNTEMPLATE: 'provisionNetworkTemplate',
  FLOWTEMPLATE: 'provisionFlowTemplate',
}

const oneApi = createApi({
  reducerPath: 'oneApi',
  baseQuery: async ({ params, command }, { dispatch, signal }) => {
    try {
      const config = requestConfig(params, command)
      const response = await http.request({ ...config, signal })

      return { data: response.data ?? {} }
    } catch (axiosError) {
      const { message, data = {}, status, statusText } = axiosError
      const { message: messageFromServer, data: errorFromOned } = data

      const error = message ?? errorFromOned ?? messageFromServer ?? statusText

      status !== httpCodes.unauthorized.id &&
        dispatch(
          enqueueSnackbar({
            key: generateKey(),
            message: error,
            options: { variant: 'error' },
          })
        )

      return {
        error: {
          status: status,
          data: message ?? data?.data ?? statusText,
        },
      }
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
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  DOCUMENT,
  DOCUMENT_POOL,
  PROVISION_CONFIG,
  PROVISION_RESOURCES,
}
