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

import { ROLE_ACTIONS, SERVICE_ACTIONS, T } from '@ConstantsModule'
import { ResourceActionConfirmation } from '@ComponentsV2Module'

const resolveHandler =
  (action, paramsContext) =>
  (submittedParams = {}) =>
    action?.mutate?.({
      ...(paramsContext ?? {}),
      ...(submittedParams ?? {}),
    })

const resolveForm = (action, formContext) =>
  typeof action?.form === 'function' ? action.form(formContext) : action?.form

const getActionType = (eACTION) =>
  SERVICE_ACTIONS?.[eACTION] ?? ROLE_ACTIONS?.[eACTION]

const isActionEnabled = (viewConfig, actionType) => {
  const actionsConfig = viewConfig?.actions
  if (!actionsConfig) return true

  return !!actionsConfig[actionType]
}

const generateOption = ({
  eACTION,
  actions,
  paramsContext,
  formContext,
  viewConfig,
  showModal,
}) => {
  const action = actions?.[eACTION]
  const {
    mutate,
    form: _actionForm,
    params: _params, // Injected by useAction
    dialogProps = {},
    description,
    confirmLabel,
    resourceType,
    ...optionProps
  } = action ?? {}

  const actionType = getActionType(eACTION)
  const title = optionProps?.title ?? T?.[eACTION] ?? actionType
  const handler = resolveHandler(action, paramsContext)
  const form = resolveForm(action, formContext)

  return {
    eACTION,
    title,
    tooltip: action?.tooltip ?? title,
    ...optionProps,
    isDisabled:
      optionProps?.isDisabled ||
      !actionType ||
      !isActionEnabled(viewConfig, actionType),
    onClick: () =>
      showModal({
        name: title,
        isConfirmDialog: !form,
        dialogProps: {
          title,
          dataCy: `modal-${actionType}`,
          ...(!form && {
            description: (
              <ResourceActionConfirmation
                description={description ?? T['resource.action.confirmation']}
                resources={formContext ?? paramsContext}
                resourceType={resourceType ?? T.Services}
              />
            ),
            confirmLabel: confirmLabel ?? title,
            ...(optionProps?.isDestructive && {
              confirmButtonProps: {
                isDestructive: true,
              },
            }),
          }),
          ...dialogProps,
        },
        ...(form && { form }),
        onSubmit: handler,
      }),
  }
}

/**
 *
 * @param {object} root0 - Params
 * @param {string[]} root0.keys - Ordered action enum keys to render
 * @param {object} root0.actions - Resolved actions, each carrying `mutate`
 * @param {*} [root0.formContext] - Forwarded to any action's form function, to seed initial values
 * @param {object} root0.viewConfig - View config, used for permission checks
 * @param {Function} root0.showModal - Modal opener
 * @param {*} [root0.paramsContext] - Forwarded to any action's params function
 * @returns {object[]} - Menu options
 */
export const generateMenuOptions = ({ keys, ...optionContext }) => {
  const toOption = (eACTION) => generateOption({ eACTION, ...optionContext })

  return keys?.map((key) =>
    Array.isArray(key) ? key.map(toOption) : toOption(key)
  )
}
