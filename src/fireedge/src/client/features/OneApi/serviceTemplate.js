/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { Actions, Commands } from 'server/routes/api/oneflow/template/routes'
import { oneApi, DOCUMENT, DOCUMENT_POOL } from 'client/features/OneApi'
import { ServiceTemplate } from 'client/constants'

const { SERVICE_TEMPLATE } = DOCUMENT
const { SERVICE_POOL, SERVICE_TEMPLATE_POOL } = DOCUMENT_POOL

const serviceTemplateApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getServiceTemplates: builder.query({
      /**
       * Retrieves information for all the service templates in the pool.
       *
       * @returns {ServiceTemplate[]} List of service templates
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.SERVICE_TEMPLATE_SHOW
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat(),
      providesTags: (serviceTemplates) =>
        serviceTemplates
          ? [
              serviceTemplates.map(({ ID }) => ({
                type: SERVICE_TEMPLATE_POOL,
                id: `${ID}`,
              })),
              SERVICE_TEMPLATE_POOL,
            ]
          : [SERVICE_TEMPLATE_POOL],
    }),
    getServiceTemplate: builder.query({
      /**
       * Retrieves information for the service template.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service template id
       * @returns {ServiceTemplate} Get service template identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_TEMPLATE_SHOW
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.DOCUMENT ?? {},
      providesTags: (_, __, { id }) => [{ type: SERVICE_TEMPLATE, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: queryService } = await queryFulfilled

          dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplates',
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
    createServiceTemplate: builder.mutation({
      /**
       * Create a new service template.
       *
       * @param {object} params - Request params
       * @param {object} params.template - Service template data in JSON syntax
       * @returns {number} Service template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_TEMPLATE_CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      providesTags: [SERVICE_TEMPLATE_POOL],
    }),
    updateServiceTemplate: builder.mutation({
      /**
       * Updates the service template contents.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service template id
       * @param {object} [params.template] - Service template data
       * @returns {number} Service template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_TEMPLATE_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      providesTags: (_, __, { id }) => [{ type: SERVICE_TEMPLATE, id }],
    }),
    removeServiceTemplate: builder.mutation({
      /**
       * Removes a given service template.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service template id
       * @returns {number} Service template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_TEMPLATE_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      providesTags: [SERVICE_TEMPLATE_POOL],
    }),
    instantiateServiceTemplate: builder.mutation({
      /**
       * Perform instantiate action on the service template.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service template id
       * @param {object} params.template - Additional parameters to be passed inside `params`
       * @returns {number} Service id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        /*
         data: {
            action: {
              perform: 'instantiate',
              params: { merge_template: data },
            },
          },
          method: PUT,
          url: `/api/${SERVICE_TEMPLATE}/action/${id}`,
        */
        const name = Actions.SERVICE_TEMPLATE_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      providesTags: [SERVICE_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetServiceTemplatesQuery,
  useLazyGetServiceTemplatesQuery,
  useGetServiceTemplateQuery,
  useLazyGetServiceTemplateQuery,

  // Mutations
  useCreateServiceTemplateMutation,
  useUpdateServiceTemplateMutation,
  useRemoveServiceTemplateMutation,
  useInstantiateServiceTemplateMutation,
} = serviceTemplateApi

export default serviceTemplateApi
