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
import { Actions, Commands } from 'server/routes/api/oneflow/template/routes'

import { oneApi, DOCUMENT, DOCUMENT_POOL } from 'client/features/OneApi'
import {
  updateResourceOnPool,
  removeResourceOnPool,
  updateNameOnResource,
  updateOwnershipOnResource,
  updateTemplateOnDocument,
} from 'client/features/OneApi/common'
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
              ...serviceTemplates.map(({ ID }) => ({
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
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplates',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplates',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
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
      invalidatesTags: [SERVICE_TEMPLATE_POOL],
    }),
    updateServiceTemplate: builder.mutation({
      /**
       * Updates the service template contents.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service template id
       * @param {object} params.template - The new template contents
       * @param {boolean} [params.append]
       * - ``true``: Merge new template with the existing one.
       * - ``false``: Replace the whole template.
       *
       * By default, ``true``.
       * @returns {number} Service template id
       * @throws Fails when response isn't code 200
       */
      query: ({ template = {}, append = true, ...params }) => {
        params.action = {
          perform: 'update',
          params: { template_json: JSON.stringify(template), append },
        }

        const name = Actions.SERVICE_TEMPLATE_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: SERVICE_TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVmTemplate = dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplates',
              { id: params.id },
              updateTemplateOnDocument(params)
            )
          )

          const patchVmTemplates = dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplates',
              undefined,
              updateTemplateOnDocument(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVmTemplate.undo()
            patchVmTemplates.undo()
          })
        } catch {}
      },
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
      invalidatesTags: [SERVICE_TEMPLATE_POOL],
    }),
    deployServiceTemplate: builder.mutation({
      /**
       * Perform instantiate action on the service template.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service template id
       * @param {object} params.template - Additional parameters to be passed inside `params`
       * @returns {number} Service id
       * @throws Fails when response isn't code 200
       */
      query: ({ template, ...params }) => {
        params.action = {
          perform: 'instantiate',
          params: { merge_template: template },
        }
        const name = Actions.SERVICE_TEMPLATE_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [SERVICE_POOL],
    }),
    changeServiceTemplatePermissions: builder.mutation({
      /**
       * Changes the permission bits of a Service template.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Service Template id
       * @param {string} params.octet - Permissions in octal format
       * @returns {number} Service Template id
       * @throws Fails when response isn't code 200
       */
      query: ({ octet, ...params }) => {
        params.action = { perform: 'chmod', params: { octet } }

        const name = Actions.SERVICE_TEMPLATE_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: SERVICE_TEMPLATE, id }],
    }),
    changeServiceTemplateOwnership: builder.mutation({
      /**
       * Changes the ownership bits of a Service template.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Service Template id
       * @param {number|'-1'} params.user - The user id
       * @param {number|'-1'} params.group - The group id
       * @returns {number} Service Template id
       * @throws Fails when response isn't code 200
       */
      query: ({ user = '-1', group = '-1', ...params }) => {
        params.action = {
          perform: 'chown',
          params: { owner_id: user, group_id: group },
        }

        const name = Actions.SERVICE_TEMPLATE_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: SERVICE_TEMPLATE, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchServiceTemplate = dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplate',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchServiceTemplates = dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplates',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchServiceTemplate.undo()
            patchServiceTemplates.undo()
          })
        } catch {}
      },
    }),
    renameServiceTemplate: builder.mutation({
      /**
       * Renames a Service template.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Service Template id
       * @param {string} params.name - The new name
       * @returns {number} Service Template id
       * @throws Fails when response isn't code 200
       */
      query: ({ name, ...params }) => {
        params.action = { perform: 'rename', params: { name } }

        const cName = Actions.SERVICE_TEMPLATE_ACTION
        const command = { name: cName, ...Commands[cName] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: SERVICE_TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchServiceTemplate = dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplate',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchServiceTemplates = dispatch(
            serviceTemplateApi.util.updateQueryData(
              'getServiceTemplates',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchServiceTemplate.undo()
            patchServiceTemplates.undo()
          })
        } catch {}
      },
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
  useDeployServiceTemplateMutation,
  useChangeServiceTemplatePermissionsMutation,
  useChangeServiceTemplateOwnershipMutation,
  useRenameServiceTemplateMutation,
} = serviceTemplateApi

export default serviceTemplateApi
