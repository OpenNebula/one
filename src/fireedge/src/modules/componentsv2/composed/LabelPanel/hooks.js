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
/* eslint-disable jsdoc/require-param-description, jsdoc/require-param-type */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { oneApi, useGeneralApi } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { encodeLabels, jsonToXml } from '@UtilsModule'
import {
  applyLabelChanges,
  createLabel,
  deleteLabel,
  updateLabel,
} from '@modules/componentsv2/composed/LabelPanel/utils'

const toTemplate = (labels, fireedge = {}) =>
  jsonToXml(
    { FIREEDGE: { ...fireedge, LABELS: encodeLabels(labels) } },
    { addRoot: true, encode: false }
  )

/**
 * Provides the mutations used by the labels panel and its dialogs.
 *
 * @param {object} params - Hook parameters
 * @param params.getLabels
 * @param params.auth
 * @param params.onLabelsChange
 * @param params.onApply
 * @param params.onCreate
 * @param params.onEdit
 * @param params.onDelete
 * @returns {object} Label operations
 */
export const useLabelOperations = ({
  getLabels,
  auth,
  onLabelsChange,
  onApply,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const dispatch = useDispatch()
  const { enqueueError, enqueueInfo } = useGeneralApi()
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    []
  )

  const executeEndpoint = useCallback(
    (endpoint, params) => dispatch(endpoint.initiate(params)).unwrap(),
    [dispatch]
  )

  const persist = useCallback(
    async ({ labels: nextLabels, affected }) => {
      const requests = []

      if (affected?.user && auth?.user?.ID != null) {
        requests.push(
          executeEndpoint(oneApi.endpoints.updateUser, {
            id: auth.user.ID,
            template: toTemplate(
              nextLabels?.user ?? {},
              auth.user?.TEMPLATE?.FIREEDGE
            ),
            replace: 1,
          })
        )
      }

      const affectedGroups = [...(affected?.groups ?? [])]
      if (affectedGroups.length) {
        const knownGroups = [].concat(auth?.groups ?? [])
        const missingGroup = affectedGroups.some(
          (groupName) => !knownGroups.some(({ NAME }) => NAME === groupName)
        )
        const groups = missingGroup
          ? await executeEndpoint(oneApi.endpoints.getGroups)
          : knownGroups

        affectedGroups.forEach((groupName) => {
          const group = groups.find(({ NAME }) => NAME === groupName)
          if (group?.ID == null) return

          requests.push(
            executeEndpoint(oneApi.endpoints.updateGroup, {
              id: group.ID,
              template: toTemplate(
                nextLabels?.group?.[groupName] ?? {},
                group?.TEMPLATE?.FIREEDGE
              ),
              replace: 1,
            })
          )
        })
      }

      await Promise.all(requests)
    },
    [auth?.groups, auth?.user, executeEndpoint]
  )

  const execute = useCallback(
    async ({ operation, handler, payload, successMessage }) => {
      isMountedRef.current && setIsLoading(true)

      try {
        const result = operation()

        if (handler) await handler({ ...payload, ...result })
        else await persist(result)

        onLabelsChange?.(result.labels)
        enqueueInfo(successMessage)

        return result.labels
      } catch (error) {
        enqueueError(error?.message ?? String(error))
        throw error
      } finally {
        isMountedRef.current && setIsLoading(false)
      }
    },
    [enqueueError, enqueueInfo, onLabelsChange, persist]
  )

  const apply = useCallback(
    ({ rows, changes, resourceType, selectedIds }) =>
      execute({
        operation: () =>
          applyLabelChanges(
            getLabels?.(),
            rows,
            changes,
            resourceType,
            selectedIds
          ),
        handler: onApply,
        payload: { rows, changes, resourceType, selectedIds },
        successMessage: T.AppliedLabels,
      }),
    [execute, getLabels, onApply]
  )

  const create = useCallback(
    (formData) =>
      execute({
        operation: () => createLabel(getLabels?.(), formData),
        handler: onCreate,
        payload: { formData },
        successMessage: T.AddedNewLabel,
      }),
    [execute, getLabels, onCreate]
  )

  const edit = useCallback(
    (row, formData) =>
      execute({
        operation: () => updateLabel(getLabels?.(), row, formData),
        handler: onEdit,
        payload: { row, formData },
        successMessage: T.UpdatedLabel,
      }),
    [execute, getLabels, onEdit]
  )

  const remove = useCallback(
    (row) =>
      execute({
        operation: () => deleteLabel(getLabels?.(), row),
        handler: onDelete,
        payload: { row },
        successMessage: T.RemovedLabel,
      }),
    [execute, getLabels, onDelete]
  )

  return { apply, create, edit, remove, isLoading }
}
