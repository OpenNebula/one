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
import { memo, useMemo, useCallback, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { useHistory, generatePath } from 'react-router-dom'

import {
  AppleImac2021 as VncIcon,
  TerminalOutline as SshIcon,
  Windows as RdpIcon,
} from 'iconoir-react'
import { SubmitButton } from 'client/components/FormControl'

import { useViews } from 'client/features/Auth'
import { useLazyGetGuacamoleSessionQuery } from 'client/features/OneApi/vm'
import { useLazyGetVMRCSessionQuery } from 'client/features/OneApi/vcenter'
import {
  isVCenter,
  getHypervisor,
  nicsIncludesTheConnectionType,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { Translate } from 'client/components/HOC'
import { T, VM, RESOURCE_NAMES, VM_ACTIONS, _APPS } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routes'

const GUACAMOLE_BUTTONS = {
  [VM_ACTIONS.VNC]: { tooltip: T.Vnc, icon: <VncIcon /> },
  [VM_ACTIONS.SSH]: { tooltip: T.Ssh, icon: <SshIcon /> },
  [VM_ACTIONS.RDP]: { tooltip: T.Rdp, icon: <RdpIcon /> },
}

const openNewBrowserTab = (path) =>
  window?.open(`/fireedge/${_APPS.sunstone.name}${path}`, '_blank')

const GuacamoleButton = memo(({ vm, connectionType, onClick }) => {
  const { icon, tooltip } = GUACAMOLE_BUTTONS[connectionType]
  const history = useHistory()
  const [getSession, { isLoading }] = useLazyGetGuacamoleSessionQuery()

  const goToConsole = useCallback(
    async (evt) => {
      try {
        evt.stopPropagation()

        const params = { id: vm?.ID, type: connectionType }
        if (typeof onClick === 'function') {
          const session = await getSession(params).unwrap()
          onClick(session)
        } else {
          openNewBrowserTab(generatePath(PATH.GUACAMOLE, params))
        }
      } catch {}
    },
    [vm?.ID, connectionType, history, onClick]
  )

  return (
    <SubmitButton
      data-cy={`${vm?.ID}-${connectionType}`}
      icon={icon}
      tooltip={<Translate word={tooltip} />}
      isSubmitting={isLoading}
      onClick={goToConsole}
    />
  )
})

const VMRCButton = memo(({ vm, onClick }) => {
  const history = useHistory()
  const [getSession, { isLoading }] = useLazyGetVMRCSessionQuery()

  const goToConsole = useCallback(
    async (evt) => {
      try {
        evt.stopPropagation()

        const params = { id: vm?.ID }
        if (typeof onClick === 'function') {
          const session = await getSession(params).unwrap()
          onClick(session)
        } else {
          openNewBrowserTab(generatePath(PATH.WMKS, params))
        }
      } catch {}
    },
    [vm?.ID, history, onClick]
  )

  return (
    <SubmitButton
      data-cy={`${vm?.ID}-vmrc`}
      icon={<VncIcon />}
      tooltip={<Translate word={T.Vmrc} />}
      isSubmitting={isLoading}
      onClick={goToConsole}
    />
  )
})

const PreConsoleButton = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.vm - Virtual machine
   * @param {'vnc'|'ssh'|'rdp'|'vmrc'} props.connectionType - Connection type
   * @param {Function} [props.onClick] - Handle click for button
   * @returns {ReactElement} - Returns button if current user has permissions about the connection type
   */
  (props) => {
    const { vm, connectionType } = props
    const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()

    const isDisabled = useMemo(() => {
      const noAction = vmView?.actions?.[connectionType] !== true
      const noAvailable = isAvailableAction(connectionType)(vm)
      const notHypervisor = !getHypervisor(vm)

      return noAction || noAvailable || notHypervisor
    }, [view, vm])

    const needNicConfig = useMemo(
      () => ![VM_ACTIONS.VNC, VM_ACTIONS.VMRC].includes(connectionType),
      [connectionType]
    )

    if (
      isDisabled ||
      (needNicConfig && !nicsIncludesTheConnectionType(vm, connectionType))
    ) {
      return null
    }

    if (connectionType === VM_ACTIONS.VMRC) {
      return isVCenter(vm) ? <VMRCButton {...props} /> : null
    }

    return !isVCenter(vm) ? <GuacamoleButton {...props} /> : null
  }
)

const ButtonPropTypes = {
  vm: PropTypes.object,
  connectionType: PropTypes.string,
  onClick: PropTypes.func,
}

GuacamoleButton.propTypes = ButtonPropTypes
VMRCButton.propTypes = ButtonPropTypes
PreConsoleButton.propTypes = ButtonPropTypes

GuacamoleButton.displayName = 'GuacamoleButton'
VMRCButton.displayName = 'VMRCButton'
PreConsoleButton.displayName = 'PreConsoleButton'

export { PreConsoleButton as ConsoleButton }
