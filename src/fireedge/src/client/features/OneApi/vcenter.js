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
import { Actions, Commands } from 'server/routes/api/vcenter/routes'
import { oneApi } from 'client/features/OneApi'

/** @type {string} Type of vCenter objects */
export const VCENTER_OBJECT = {
  DATASTORES: 'datastores',
  HOSTS: 'hosts',
  IMAGES: 'images',
  NETWORKS: 'networks',
  TEMPLATES: 'templates',
}

const vcenterApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVMRCSession: builder.query({
      /**
       * Returns a VMware Remote Console session.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @returns {string} The session token
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VCENTER_TOKEN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
  }),
})

export const {
  // Queries
  useGetVMRCSessionQuery,
  useLazyGetVMRCSessionQuery,
} = vcenterApi

export default vcenterApi
