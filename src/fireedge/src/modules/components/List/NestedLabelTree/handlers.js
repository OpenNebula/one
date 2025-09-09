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
  getNodeIdFromEvent,
  transformTreeMetadata,
  formatAddLabel,
  removeNode,
  stripTreeMetadata,
} from '@modules/components/List/NestedLabelTree/utils'
import { GroupAPI, UserAPI, useGeneralApi, oneApi } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { isDevelopment, encodeLabels } from '@UtilsModule'
import { jsonToXml } from '@ModelsModule'
import { useDispatch } from 'react-redux'

/**
 * @param {Function} event - Click event
 * @param {Function} onToggle - Toggle
 */
export const handleNodeToggle = (event, onToggle) => {
  if (event.target.closest('input[type="checkbox"]')) {
    return
  }

  const nodeId = getNodeIdFromEvent(event)
  if (!nodeId) return

  onToggle(nodeId)
}

/**
 * @returns {Function} - Hook to apply labels
 */
export const useLabelMutations = () => {
  const dispatch = useDispatch()
  const [updateUser, { isLoading: applyingUserLabels }] =
    UserAPI.useUpdateUserMutation()
  const [updateGroup, { isLoading: applyingGroupLabels }] =
    GroupAPI.useUpdateGroupMutation()
  const [getGroups] = GroupAPI.useLazyGetGroupsQuery()

  const update = async (api, params) => {
    if (api) {
      await api(params)
    }
  }

  const dispatchUpdate = async (endpoint, params) => {
    if (endpoint) {
      await dispatch(endpoint.initiate(params)).unwrap()
    }
  }

  const { enqueueInfo, enqueueError } = useGeneralApi()

  const removeLabel = async ({ formData, state, info }) => {
    const { fullPath } = formData
    const { labelType, uId } = info

    const strippedTree = stripTreeMetadata(state)
    const labelPath = fullPath?.split('/')
    const path = [labelType, ...labelPath]
    const modifiedTree = removeNode(strippedTree, path)

    const promises = []

    if (labelType === 'user') {
      promises.push(
        updateUser({
          id: uId,
          template: jsonToXml(
            {
              LABELS: encodeLabels(modifiedTree?.[labelType]),
            },
            { addRoot: true, encode: false }
          ),
          replace: 1,
        })
      )
    }

    if (labelType === 'group') {
      const groupName = labelPath?.[0]
      const groupTree = modifiedTree?.[labelType]?.[groupName]

      const { data: groups = [] } = await getGroups()
      const groupIdMap = Object.fromEntries(
        []
          .concat(groups)
          ?.map((group) => [group?.NAME, group?.ID])
          ?.filter(Boolean)
      )

      const groupId = groupIdMap?.[groupName]

      promises.push(
        updateGroup({
          id: groupId,
          template: jsonToXml(
            {
              FIREEDGE: { LABELS: encodeLabels(groupTree) },
            },
            { addRoot: true, encode: false }
          ),
          replace: 1,
        })
      )
    }

    if (promises.length > 0) {
      await Promise.all(promises)
      enqueueInfo(T.RemovedLabel)
    }

    return modifiedTree
  }

  const addLabel = async ({ formData, state, info }) => {
    const { type, data, groupName, modifiedTree } = await formatAddLabel(
      formData,
      state
    )
    const { uId } = info

    const promises = []

    if (type === 'user') {
      promises.push(
        dispatchUpdate(oneApi.endpoints.updateUser, {
          id: uId,
          template: jsonToXml(
            { LABELS: encodeLabels(data) },
            { addRoot: true, encode: false }
          ),
          replace: 1,
        })
      )
    }

    if (type === 'group') {
      const { data: groups = [] } = await getGroups()
      const groupIdMap = Object.fromEntries(
        []
          .concat(groups)
          ?.map((group) => [group?.NAME, group?.ID])
          ?.filter(Boolean)
      )

      const groupId = groupIdMap?.[groupName]

      promises.push(
        dispatchUpdate(oneApi.endpoints.updateGroup, {
          id: groupId,
          template: jsonToXml(
            { FIREEDGE: { LABELS: encodeLabels(data) } },
            { addRoot: true, encode: false }
          ),
          replace: 1,
        })
      )
    }

    if (promises.length > 0) {
      await Promise.all(promises)
      enqueueInfo(T.AddedNewLabel)
    }

    return modifiedTree
  }

  const applyLabels = async ({ state, info }) => {
    const { resourceType, rowIds, uId, modifiedPaths } = info
    const transformedTree = transformTreeMetadata(state, resourceType, rowIds)
    const { user: userTree, group: groupTree } = transformedTree

    const modifiedGroups = [
      ...new Set(
        modifiedPaths
          .filter((path) => path.startsWith('group.'))
          .map((path) => path.split('.')?.[1])
          .filter(Boolean)
      ),
    ]

    const hasModifiedUserLabels =
      [
        ...new Set(
          modifiedPaths
            ?.filter((path) => path?.startsWith('user.'))
            .filter(Boolean)
        ),
      ]?.length > 0

    const promises = []

    if (hasModifiedUserLabels) {
      if (userTree) {
        promises.push(
          update(updateUser, {
            id: uId,
            template: jsonToXml(
              { LABELS: encodeLabels(userTree) },
              { addRoot: true, encode: false }
            ),
            replace: 1,
          })
        )
      }
    }

    if (modifiedGroups?.length > 0) {
      try {
        const { data: groups = [] } = await getGroups()
        const groupIdMap = Object.fromEntries(
          []
            .concat(groups)
            ?.map((group) => [group?.NAME, group?.ID])
            ?.filter(Boolean)
        )
        for (const groupName of modifiedGroups) {
          const groupLabels = groupTree?.[groupName]
          const groupId = groupIdMap?.[groupName]

          if (!groupLabels || !groupId) continue

          promises.push(
            update(updateGroup, {
              id: groupId,
              template: jsonToXml(
                {
                  FIREEDGE: { LABELS: encodeLabels(groupLabels) },
                },
                { addRoot: true, encode: false }
              ),
              replace: 1,
            })
          )
        }
      } catch (err) {
        enqueueError('Failed to apply group labels')
        isDevelopment() && console.log('Group labels error: ', err)
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises)
      enqueueInfo(T.AppliedLabels)
    }

    return true
  }

  return [
    {
      applyLabels,
      addLabel,
      removeLabel,
    },
    { isLoading: applyingUserLabels || applyingGroupLabels },
  ]
}
