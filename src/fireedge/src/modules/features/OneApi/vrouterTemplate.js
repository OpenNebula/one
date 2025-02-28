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
import {
  Actions as VROUTER_ACTIONS,
  Commands,
} from 'server/utils/constants/commands/vrouter'
import { Actions as VMTEMPLATE_ACTIONS } from 'server/utils/constants/commands/template'

import { oneApi } from '@modules/features/OneApi/oneApi'

import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from '@modules/features/OneApi/resources'
import {
  updateResourceOnPool,
  removeResourceOnPool,
  updateTemplateOnResource,
} from '@modules/features/OneApi/common'
import { FilterFlag, VmVrTemplate } from '@ConstantsModule'

const { TEMPLATE } = ONE_RESOURCES
const { TEMPLATE_POOL } = ONE_RESOURCES_POOL

const vrouterTemplatesApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVrTemplates: builder.query({
      /**
       * Retrieves information for all or part of the Resources in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {VmVrTemplate[]} List of VM VrTemplates
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = VMTEMPLATE_ACTIONS.TEMPLATE_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) =>
        [
          [data?.VMTEMPLATE_POOL?.VMTEMPLATE]
            ?.flat()
            ?.filter((template) => template?.TEMPLATE?.VROUTER === 'YES') ?? [],
        ].flat(),
      providesTags: (vrouterVrTemplates) =>
        vrouterVrTemplates
          ? [
              ...vrouterVrTemplates.map(({ ID }) => ({
                type: TEMPLATE_POOL,
                id: `${ID}`,
              })),
              TEMPLATE_POOL,
            ]
          : [TEMPLATE_POOL],
    }),
    getVrTemplate: builder.query({
      /**
       * Retrieves information for the vm template.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VrTemplate id
       * @param {boolean} params.extended - True to include extended information
       * @param {boolean} [params.decrypt] - True to decrypt contained secrets (only admin)
       * @returns {VmVrTemplate} Get template identified by id
       * @throws Fails when response isn't code 200
       */
      queryFn: (params, { dispatch }) =>
        dispatch(vrouterTemplatesApi.endpoints.getVrTemplates.initiate({}))
          .unwrap()
          .then((vrouterTemplates) => {
            const wrappedParamId = String(params?.id)

            if (!wrappedParamId || isNaN(wrappedParamId)) {
              throw new Error(`Vr Template ID missing!`)
            }

            const template = vrouterTemplates.find(
              (vrtemplate) => vrtemplate?.ID === wrappedParamId
            )

            if (!template) {
              throw new Error(`Vr template with ID ${params?.id} not found`)
            }

            return { data: template }
          })
          .catch((error) => ({ error })),

      transformResponse: (data) => data?.VMTEMPLATE ?? {},
      providesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            vrouterTemplatesApi.util.updateQueryData(
              'getVrTemplates',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            vrouterTemplatesApi.util.updateQueryData(
              'getVrTemplates',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    allocateVrTemplate: builder.mutation({
      /**
       * Allocates a new VM VrTemplate in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template on syntax XML
       * @returns {number} VM VrTemplate id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = VROUTER_ACTIONS.VROUTER_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    instantiateVrTemplate: builder.mutation({
      /**
       * Instantiates a new virtual machine from a template.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - VrTemplate id
       * @param {boolean} params.fromPostbody - Use postbody params instead of resource
       * @param {string} params.name - Name for the new VM instance
       * @param {boolean} params.hold - True to create it on hold state
       * @param {boolean} params.persistent - True to create a private persistent copy
       * @param {string} params.template - Extra template to be merged with the one being instantiated
       * @returns {number} VrTemplate id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name =
          VROUTER_ACTIONS?.[
            params?.fromPostbody
              ? 'VROUTER_INSTANTIATE_POSTBODY'
              : 'VROUTER_INSTANTIATE'
          ]
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    updateVrTemplate: builder.mutation({
      /**
       * Replaces the template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - VrTemplate id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} VrTemplate id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = VMTEMPLATE_ACTIONS.TEMPLATE_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVrTemplate = dispatch(
            vrouterTemplatesApi.util.updateQueryData(
              'getVrTemplate',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchVrTemplates = dispatch(
            vrouterTemplatesApi.util.updateQueryData(
              'getVrTemplates',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVrTemplate.undo()
            patchVrTemplates.undo()
          })
        } catch {}
      },
    }),
  }),
})

const vrouterTemplateQueries = (({
  // Queries
  useGetVrTemplatesQuery,
  useLazyGetVrTemplatesQuery,
  useGetVrTemplateQuery,
  useLazyGetVrTemplateQuery,

  // Mutations
  useAllocateVrTemplateMutation,
  useInstantiateVrTemplateMutation,
  useUpdateVrTemplateMutation,
}) => ({
  // Queries
  useGetVrTemplatesQuery,
  useLazyGetVrTemplatesQuery,
  useGetVrTemplateQuery,
  useLazyGetVrTemplateQuery,

  // Mutations
  useAllocateVrTemplateMutation,
  useInstantiateVrTemplateMutation,
  useUpdateVrTemplateMutation,
}))(vrouterTemplatesApi)

export default vrouterTemplateQueries
