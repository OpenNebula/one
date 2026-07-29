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

import { T, VM_ACTIONS, _APPS, PATH } from '@ConstantsModule'
import { ResourceActionConfirmation } from '@ComponentsV2Module'
import {
  getVmActionAvailableStates,
  isVmAvailableAction,
  getDisks,
  getHypervisor,
  nicsIncludesTheConnectionType,
} from '@ModelsModule'
import { generatePath } from 'react-router-dom'
import {
  Windows as RdpIcon,
  TerminalTag as SshIcon,
  AppleImac2021 as VncIcon,
} from 'iconoir-react'

const isEvent = (value) =>
  value?.nativeEvent && typeof value?.preventDefault === 'function'

const resolveHandler =
  (action, paramsContext, onSuccess, success) =>
  async (submittedParams = {}) => {
    const result = await action?.mutate?.({
      ...(paramsContext ?? {}),
      ...(isEvent(submittedParams) ? {} : submittedParams ?? {}),
    })

    if (result?.error) return false
    success && onSuccess?.(success)

    return result
  }

const resolveForm = (action, formContext) =>
  typeof action?.form === 'function' ? action.form(formContext) : action?.form

const getAvailabilityTooltip = (availableStates = []) =>
  availableStates.length
    ? `Action only available in ${availableStates.join(', ')}`
    : undefined

const generateOption = ({
  eACTION,
  actions,
  vm,
  paramsContext,
  formContext,
  viewConfig,
  showModal,
  onSuccess,
}) => {
  const action = actions?.[eACTION]
  const {
    mutate,
    form: actionForm,
    params: _params, // Injected by useAction
    dialogProps = {},
    isFormDialog = false,
    description,
    confirmLabel,
    resourceType,
    success,
    tooltip: actionTooltip,
    ...optionProps
  } = action ?? {}

  const actionType = VM_ACTIONS?.[eACTION]
  const title = T?.[eACTION]
  const handler = resolveHandler(action, paramsContext, onSuccess, success)
  const form = !isFormDialog && resolveForm(action, formContext)
  const isAvailableByState = isVmAvailableAction(actionType, vm)
  const stateTooltip = !isAvailableByState
    ? getAvailabilityTooltip(getVmActionAvailableStates(actionType, vm))
    : undefined
  const isDisabledByOption = optionProps?.isDisabled
  const isDisabledByView = !viewConfig?.actions?.[actionType]
  const isDisabledByState = !isAvailableByState
  const disabledTooltip = isDisabledByView
    ? T.ActionNotAllowedInCurrentView
    : isDisabledByState
    ? stateTooltip
    : undefined
  const tooltip = actionTooltip ?? disabledTooltip
  const confirmDialogProps =
    !isFormDialog && !form
      ? {
          description: (
            <ResourceActionConfirmation
              description={description ?? T['resource.action.confirmation']}
              resources={formContext ?? vm ?? paramsContext}
              resourceType={resourceType ?? T.VirtualMachines}
            />
          ),
          confirmLabel: confirmLabel ?? title,
          ...(optionProps?.isDestructive && {
            confirmButtonProps: {
              isDestructive: true,
            },
          }),
        }
      : {}

  return {
    eACTION,
    title,
    ...optionProps,
    tooltip,
    isDisabled: isDisabledByOption || isDisabledByView || isDisabledByState,
    onClick: () =>
      showModal({
        name: title,
        isFormDialog,
        ...(!isFormDialog && { isConfirmDialog: !form }),
        dialogProps: {
          title,
          dataCy: `modal-${actionType}`,
          ...confirmDialogProps,
          ...(isFormDialog && { steps: actionForm }),
          ...dialogProps,
        },
        ...(!isFormDialog && form && { form }),
        onSubmit: handler,
      }),
  }
}

/**
 *
 * @param {object} root0 - Params
 * @param {string[]} root0.keys - Ordered VM_ACTION_ENUM keys to render
 * @param {object} root0.actions - Resolved actions, each carrying `mutate`
 * @param {object} root0.vm - VM, used for availability checks
 * @param {*} [root0.formContext] - Forwarded to any action's form function, to seed initial values
 * @param {object} root0.viewConfig - View config, used for permission checks
 * @param {Function} root0.showModal - Modal opener
 * @param {*} [root0.paramsContext] - Forwarded to any action's params function
 * @returns {object[]} - Menu options
 */
export const generateMenuOptions = ({ keys, vm, ...optionContext }) => {
  const toOption = (eACTION) =>
    generateOption({ eACTION, vm, ...optionContext })

  return keys?.map((key) =>
    Array.isArray(key) ? key.map(toOption) : toOption(key)
  )
}

const CONSOLE_ACTIONS = {
  [VM_ACTIONS.VNC]: {
    title: T.Vnc,
    startIcon: <VncIcon />,
    needsNic: false,
  },
  [VM_ACTIONS.SSH]: {
    title: T.Ssh,
    startIcon: <SshIcon />,
    needsNic: true,
  },
  [VM_ACTIONS.RDP]: {
    title: T.Rdp,
    startIcon: <RdpIcon />,
    needsNic: true,
  },
}

const openConsoleTab = (path) =>
  window?.open(`/fireedge/${_APPS.sunstone}${path}`, '_blank')

export const generateConsoleOptions = ({
  vm = {},
  viewConfig = {},
  zone,
  defaultZone,
}) =>
  Object.entries(CONSOLE_ACTIONS).map(
    ([connectionType, { needsNic, ...option }]) => {
      const params = {
        id: vm?.ID,
        type: connectionType,
        ...(zone !== defaultZone ? { zone } : {}),
      }

      const isDisabled =
        !viewConfig?.actions?.[connectionType] ||
        !isVmAvailableAction(connectionType, vm) ||
        !getHypervisor(vm) ||
        !getDisks(vm)?.length ||
        (needsNic && !nicsIncludesTheConnectionType(vm, connectionType))

      return {
        ...option,
        isDisabled,
        dataCy: `${vm?.ID}-${connectionType}`,
        onClick: (evt) => {
          evt?.stopPropagation?.()

          const path = `${generatePath(PATH.GUACAMOLE, params)}?zone=${zone}`
          openConsoleTab(path)
        },
      }
    }
  )
