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
import { Actions, Commands } from 'server/routes/api/oneflow/service/routes'
import { oneApi, DOCUMENT, DOCUMENT_POOL } from 'client/features/OneApi'
import { Service } from 'client/constants'

const { SERVICE } = DOCUMENT
const { SERVICE_POOL } = DOCUMENT_POOL

const serviceApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query({
      /**
       * Retrieves information for all the services in the pool.
       *
       * @returns {Service[]} List of services
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.SERVICE_SHOW
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat(),
      providesTags: (services) =>
        services
          ? [
              services.map(({ ID }) => ({ type: SERVICE_POOL, id: `${ID}` })),
              SERVICE_POOL,
            ]
          : [SERVICE_POOL],
    }),
    getService: builder.query({
      /**
       * Retrieves information for the service.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @returns {Service} Get service identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_SHOW
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.DOCUMENT ?? {},
      providesTags: (_, __, { id }) => [{ type: SERVICE, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: queryService } = await queryFulfilled

          dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              (draft) => {
                const index = draft.findIndex(({ ID }) => +ID === +id)
                index !== -1 && (draft[index] = queryService)
              }
            )
          )
        } catch {}
      },
    }),
  }),
})

export const {
  // Queries
  useGetServicesQuery,
  useLazyGetServicesQuery,
  useGetServiceQuery,
  useLazyGetServiceQuery,
} = serviceApi

export default serviceApi
