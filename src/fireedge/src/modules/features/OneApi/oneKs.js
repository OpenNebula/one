/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Cluster, RESOURCE_NAMES } from '@ConstantsModule'
import { updateOwnershipOnResource } from '@modules/features/OneApi/common'
import {
  withProfileLabelsTags,
  withResourceLabels,
} from '@modules/features/OneApi/labels'
import { oneApi } from '@modules/features/OneApi/oneApi'
import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from '@modules/features/OneApi/resources'
import { Actions, Commands } from 'server/routes/api/oneks/routes'

const { ONEKS } = ONE_RESOURCES
const { ONEKS_POOL } = ONE_RESOURCES_POOL

const PERMISSION_KEYS_BY_OCTAL = [
  ['OWNER_U', 'OWNER_M', 'OWNER_A'],
  ['GROUP_U', 'GROUP_M', 'GROUP_A'],
  ['OTHER_U', 'OTHER_M', 'OTHER_A'],
]

const PERMISSION_VALUES = [4, 2, 1]

const hasResourceId = (id) => id !== undefined && id !== null

const getOneKsResource = (resource) => resource?.DOCUMENT ?? resource

const withOneKsLabels = (resource, meta) => {
  const labeledResource = withResourceLabels(
    getOneKsResource(resource),
    RESOURCE_NAMES.ONEKS,
    meta
  )

  return resource?.DOCUMENT
    ? { ...resource, DOCUMENT: labeledResource }
    : labeledResource
}

const getOneKsResourceId = (resource) => getOneKsResource(resource)?.ID

const isSameOneKsResource = (resource, id) =>
  hasResourceId(id) && `${getOneKsResourceId(resource)}` === `${id}`

const oneKsPoolTag = (id) => ({ type: ONEKS_POOL, id: `${id}` })

const oneKsDetailTag = (id) => ({ type: ONEKS, id: `${id}` })

const oneKsDetailAndPoolTags = (id) => [
  oneKsDetailTag(id),
  oneKsPoolTag(id),
  ONEKS_POOL,
]

const getOneKsPoolTags = (clusters = []) => [
  ...clusters.map(getOneKsResourceId).filter(hasResourceId).map(oneKsPoolTag),
  ONEKS_POOL,
]

const updateOneKsQueriesByTag = ({
  api,
  state,
  dispatch,
  tag,
  endpointName,
  updateRecipe,
}) =>
  api.util
    .selectInvalidatedBy(state, [tag])
    .filter((query) => query.endpointName === endpointName)
    .map(({ originalArgs }) =>
      dispatch(
        api.util.updateQueryData(endpointName, originalArgs, updateRecipe)
      )
    )

const updateOneKsResourceInDraft =
  ({ id, updateResource }) =>
  (draft) => {
    if (!hasResourceId(id) || !draft) return

    if (Array.isArray(draft)) {
      draft.forEach((entry) => {
        if (!isSameOneKsResource(entry, id)) return

        const entryResource = getOneKsResource(entry)
        entryResource && updateResource(entryResource)
      })

      return
    }

    const resource = getOneKsResource(draft)
    const resourceId = getOneKsResourceId(draft)

    if (
      !resource ||
      (hasResourceId(resourceId) && !isSameOneKsResource(draft, id))
    ) {
      return
    }

    updateResource(resource)
  }

const updateOneKsResourceOnPool =
  ({ id, resourceFromQuery }) =>
  (draft) => {
    if (!Array.isArray(draft) || !hasResourceId(id)) return

    const resourceIndex = draft.findIndex((entry) =>
      isSameOneKsResource(entry, id)
    )
    const resource = getOneKsResource(resourceFromQuery)

    if (resourceIndex === -1 || !resource) return

    if (draft[resourceIndex]?.DOCUMENT) {
      draft[resourceIndex].DOCUMENT = resource

      return
    }

    draft[resourceIndex] = resource
  }

const removeOneKsResourceOnPool =
  ({ id }) =>
  (draft) => {
    if (!Array.isArray(draft) || !hasResourceId(id)) return

    return draft.filter((entry) => !isSameOneKsResource(entry, id))
  }

const updateOneKsPermissionsFromOctet = ({ id, octet }) =>
  updateOneKsResourceInDraft({
    id,
    updateResource: (resource) => {
      const octal = `${octet ?? ''}`.padStart(3, '0').slice(-3)

      if (!/^[0-7]{3}$/.test(octal)) return

      resource.PERMISSIONS ??= {}

      PERMISSION_KEYS_BY_OCTAL.forEach((permissionKeys, index) => {
        let permissionValue = Number(octal[index])

        permissionKeys.forEach((permissionKey, permissionIndex) => {
          const value = PERMISSION_VALUES[permissionIndex]
          const isEnabled = permissionValue >= value

          resource.PERMISSIONS[permissionKey] = isEnabled ? '1' : '0'
          permissionValue -= isEnabled ? value : 0
        })
      })
    },
  })

const oneKsApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getOneKsClusters: builder.query({
      /**
       * Retrieves information for all the oneks clusters in the pool.
       *
       * @param {object} params - Request params
       * @param {string} [params.zone] - Zone from where to get the resources
       * @returns {Cluster[]} List of clusters
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LIST
        const command = { name, ...Commands[name] }

        return {
          command,
          params,
          needStateInMeta: true,
          showNotification: false,
        }
      },
      transformResponse: (data, meta) =>
        [data ?? []].flat().map((resource) => withOneKsLabels(resource, meta)),
      providesTags: (clusters) =>
        withProfileLabelsTags(
          clusters ? getOneKsPoolTags(clusters) : [ONEKS_POOL]
        ),
    }),
    getOneKsCluster: builder.query({
      /**
       * Retrieves information for the oneks cluster.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Cluster id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {Cluster} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SHOW
        const command = { name, ...Commands[name] }

        return { params, command, needStateInMeta: true }
      },
      transformResponse: (data, meta) => withOneKsLabels(data ?? {}, meta),
      providesTags: (_, __, { id }) =>
        withProfileLabelsTags([oneKsDetailTag(id)]),
      async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          updateOneKsQueriesByTag({
            api: oneKsApi,
            state: getState(),
            dispatch,
            tag: ONEKS_POOL,
            endpointName: 'getOneKsClusters',
            updateRecipe: updateOneKsResourceOnPool({ id, resourceFromQuery }),
          })
        } catch {
          // if the query fails, we want to remove the resource from the pool
          updateOneKsQueriesByTag({
            api: oneKsApi,
            state: getState(),
            dispatch,
            tag: ONEKS_POOL,
            endpointName: 'getOneKsClusters',
            updateRecipe: removeOneKsResourceOnPool({ id }),
          })
        }
      },
    }),
    deleteOneKsCluster: builder.mutation({
      query: (params) => {
        const name = Actions.DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    updateOneKsClusterNodeGroups: builder.mutation({
      query: (params) => {
        const name = Actions.UPDATE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    scaleOneKsClusterNodeGroups: builder.mutation({
      query: (params) => {
        const name = Actions.SCALE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    deleteNodeGroup: builder.mutation({
      /**
       * Removes a nodegroup.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Node group id
       * @param {string} params.nodegroup_id - ID of the node group to remove
       * @returns {number} Node group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DELETE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    getOneKsFamilies: builder.query({
      /**
       * Retrieves oneks families.
       *
       * @param {object} params - Request params
       * @returns {object} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LIST_FAMILIES
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data ?? {},
    }),
    validateOneKsDeployment: builder.mutation({
      /**
       * Validates a OneKS deployment placement.
       *
       * @param {object} params - Request params
       * @returns {object} Deployment validation result
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VALIDATE_DEPLOYMENT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    getKubeConfig: builder.query({
      /**
       * Retrieves the Kubernetes configuration for a cluster.
       *
       * @param {object} params - Request params
       * @returns {Cluster} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.KUBECONFIG
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => {
        if (
          !data ||
          (typeof data === 'object' && Object.keys(data).length === 0)
        ) {
          return ''
        }

        return data
      },
    }),
    createOneKsCluster: builder.mutation({
      /**
       * Create a new cluster in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Name for the new cluster
       * @returns {number} The allocated cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ONEKS_POOL],
    }),
    createOneKsNodeGroup: builder.mutation({
      /**
       * Create a new node group in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Name for the new node group
       * @returns {number} The allocated node group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CREATE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    getKubernetesLogs: builder.query({
      /**
       * Retrieves log for a provider.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Provision id
       * @returns {object} Provider logs
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LOGS
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      keepUnusedDataFor: 0,
      providesTags: [],
    }),
    getOneKsNodegroupFamilies: builder.query({
      /**
       * Retrieves oneks nodegroup families.
       *
       * @param {object} params - Request params
       * @returns {object} Get nodegroup families
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LIST_NODEGROUP_FAMILIES
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data ?? {},
    }),
    recoverOneKsCluster: builder.mutation({
      /**
       * Recover oneks cluster.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Provision id
       * @returns {object} Provider logs
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.RECOVER
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    recoverOneKsNodeGroup: builder.mutation({
      /**
       * Recover oneks a node group.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Provision id
       * @returns {object} Provider logs
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.RECOVER_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    changeOneKsClusterPermissions: builder.mutation({
      /**
       * Changes the permission bits of a oneks cluster.
       * If set to `-1`, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Cluster id
       * @param {string} params.octet - Permissions in octal format
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: ({ octet, ...params }) => {
        params.octet = octet
        const name = Actions.CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => oneKsDetailAndPoolTags(id),
      onQueryStarted(params, { dispatch, getState, queryFulfilled }) {
        let patches = []

        try {
          const state = getState()
          const updateRecipe = updateOneKsPermissionsFromOctet(params)
          patches = [
            ...updateOneKsQueriesByTag({
              api: oneKsApi,
              state,
              dispatch,
              tag: oneKsDetailTag(params.id),
              endpointName: 'getOneKsCluster',
              updateRecipe,
            }),
            ...updateOneKsQueriesByTag({
              api: oneKsApi,
              state,
              dispatch,
              tag: ONEKS_POOL,
              endpointName: 'getOneKsClusters',
              updateRecipe,
            }),
          ]

          queryFulfilled.catch(() => patches.forEach((patch) => patch.undo()))
        } catch {
          patches.forEach((patch) => patch.undo())
        }
      },
    }),
    changeOneKsClusterOwnership: builder.mutation({
      /**
       * Changes the ownership bits of a oneks cluster.
       * If set to `-1`, the user or group is not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Cluster id
       * @param {number} params.user - New user id
       * @param {number} params.group - New group id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: ({ user, group, ...params }) => {
        const isOwnerChange = user !== undefined && `${user}` !== '-1'
        const name = isOwnerChange ? Actions.CHOWN : Actions.CHGRP

        if (isOwnerChange) {
          params.owner_id = user
          params.group_id =
            group !== undefined && `${group}` !== '-1' ? group : null
        } else {
          params.group_id = group
        }

        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => oneKsDetailAndPoolTags(id),
      onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        let patches = []

        try {
          const state = getState()
          const updateRecipe = updateOneKsResourceInDraft({
            id: params.id,
            updateResource: updateOwnershipOnResource(state, params),
          })
          patches = [
            ...updateOneKsQueriesByTag({
              api: oneKsApi,
              state,
              dispatch,
              tag: oneKsDetailTag(params.id),
              endpointName: 'getOneKsCluster',
              updateRecipe,
            }),
            ...updateOneKsQueriesByTag({
              api: oneKsApi,
              state,
              dispatch,
              tag: ONEKS_POOL,
              endpointName: 'getOneKsClusters',
              updateRecipe,
            }),
          ]

          queryFulfilled.catch(() => patches.forEach((patch) => patch.undo()))
        } catch {
          patches.forEach((patch) => patch.undo())
        }
      },
    }),
    updateOneKsDocument: builder.mutation({
      /**
       * Change oneKs Document .
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - OneKs cluster id
       * @param {string} params.name - The new name
       * @returns {number} OneKs cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.UPDATE_DOCUMENT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    updateOneKsKubernetesVersion: builder.mutation({
      /**
       * Change oneKs Kubernetes version .
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - OneKs cluster id
       * @param {string} params.kubernetes_version - The new Kubernetes version
       * @returns {number} OneKs cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.UPGRADE_KUBERNETES_VERSION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
  }),
})

const oneKsQueries = (({
  // Queries
  useGetOneKsClustersQuery,
  useLazyGetOneKsClustersQuery,
  useGetOneKsClusterQuery,
  useLazyGetOneKsClusterQuery,
  useGetOneKsFamiliesQuery,
  useLazyGetOneKsFamiliesQuery,
  useGetKubeConfigQuery,
  useLazyGetKubeConfigQuery,
  useGetKubernetesLogsQuery,
  useLazyGetKubernetesLogsQuery,
  useGetOneKsNodegroupFamiliesQuery,
  useLazyGetOneKsNodegroupFamiliesQuery,

  // Mutations
  useCreateOneKsClusterMutation,
  useValidateOneKsDeploymentMutation,
  useDeleteOneKsClusterMutation,
  useDeleteNodeGroupMutation,
  useScaleOneKsClusterNodeGroupsMutation,
  useCreateOneKsNodeGroupMutation,
  useRecoverOneKsClusterMutation,
  useRecoverOneKsNodeGroupMutation,
  useChangeOneKsClusterPermissionsMutation,
  useChangeOneKsClusterOwnershipMutation,
  useUpdateOneKsDocumentMutation,
  useUpdateOneKsKubernetesVersionMutation,
  useUpdateOneKsClusterNodeGroupsMutation,
}) => ({
  // Queries
  useGetOneKsClustersQuery,
  useLazyGetOneKsClustersQuery,
  useGetOneKsClusterQuery,
  useLazyGetOneKsClusterQuery,
  useGetOneKsFamiliesQuery,
  useLazyGetOneKsFamiliesQuery,
  useGetKubeConfigQuery,
  useLazyGetKubeConfigQuery,
  useGetKubernetesLogsQuery,
  useLazyGetKubernetesLogsQuery,
  useGetOneKsNodegroupFamiliesQuery,
  useLazyGetOneKsNodegroupFamiliesQuery,

  // Mutations
  useCreateOneKsClusterMutation,
  useValidateOneKsDeploymentMutation,
  useDeleteOneKsClusterMutation,
  useDeleteNodeGroupMutation,
  useScaleOneKsClusterNodeGroupsMutation,
  useCreateOneKsNodeGroupMutation,
  useRecoverOneKsClusterMutation,
  useRecoverOneKsNodeGroupMutation,
  useChangeOneKsClusterPermissionsMutation,
  useChangeOneKsClusterOwnershipMutation,
  useUpdateOneKsDocumentMutation,
  useUpdateOneKsKubernetesVersionMutation,
  useUpdateOneKsClusterNodeGroupsMutation,
}))(oneKsApi)

export default oneKsQueries
