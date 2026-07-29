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
/* eslint-disable jsdoc/require-jsdoc */

import { useMemo } from 'react'
import { ServiceAPI } from '@FeaturesModule'
import ACTION_DEFINITIONS from '@modules/resources/resources/Service/Actions/definitions'

const resolveMutation =
  ({ trigger, context, params = {} }) =>
  (callParams = {}) => {
    const allParams = {
      ...callParams,
      ...(typeof params === 'function' ? params(callParams) : params),
    }

    return (context ? context(trigger) : trigger)?.({
      ...allParams,
    })
  }

const resolveDefs = (hookTriggerLookup, context) =>
  Object.fromEntries(
    Object.entries(ACTION_DEFINITIONS).map(
      ([key, { useMutation, params, ...def }]) => [
        key,
        {
          ...def,
          params,
          mutate: resolveMutation({
            trigger: hookTriggerLookup.get(useMutation),
            context,
            params,
          }),
        },
      ]
    )
  )

export const useActions = ({ context } = {}) => {
  const [remove, { isLoading: isRemoving }] =
    ServiceAPI.useRemoveServiceMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    ServiceAPI.useChangeServiceOwnerMutation()
  const [recover, { isLoading: isRecovering }] =
    ServiceAPI.useRecoverServiceMutation()
  const [addRole, { isLoading: isAddingRole }] =
    ServiceAPI.useServiceAddRoleMutation()
  const [addServiceAction, { isLoading: isAddingServiceAction }] =
    ServiceAPI.useServiceAddActionMutation()
  const [roleAction, { isLoading: isAddingRoleAction }] =
    ServiceAPI.useServiceRoleActionMutation()
  const [scaleRole, { isLoading: isScalingRole }] =
    ServiceAPI.useServiceScaleRoleMutation()

  const hookTriggerLookup = useMemo(
    () =>
      new Map([
        [ServiceAPI.useRemoveServiceMutation, remove],
        [ServiceAPI.useChangeServiceOwnerMutation, changeOwnership],
        [ServiceAPI.useRecoverServiceMutation, recover],
        [ServiceAPI.useServiceAddRoleMutation, addRole],
        [ServiceAPI.useServiceAddActionMutation, addServiceAction],
        [ServiceAPI.useServiceRoleActionMutation, roleAction],
        [ServiceAPI.useServiceScaleRoleMutation, scaleRole],
      ]),
    [
      addRole,
      addServiceAction,
      changeOwnership,
      recover,
      remove,
      roleAction,
      scaleRole,
    ]
  )

  const resolvedDefs = useMemo(
    () => resolveDefs(hookTriggerLookup, context),
    [hookTriggerLookup, context]
  )

  const isLoading =
    isAddingRole ||
    isAddingRoleAction ||
    isAddingServiceAction ||
    isChangingOwnership ||
    isRemoving ||
    isRecovering ||
    isScalingRole

  return { actions: resolvedDefs, isLoading }
}
