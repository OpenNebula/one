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
import PropTypes from 'prop-types'
import { ReactElement, memo, useCallback, useMemo } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { SubmitButton } from '@modules/components/FormControl'
import {
  Windows as RdpIcon,
  TerminalTag as SshIcon,
  AppleImac2021 as VncIcon,
} from 'iconoir-react'

import { VmAPI, useGeneral, useViews } from '@FeaturesModule'

import { RESOURCE_NAMES, T, VM, VM_ACTIONS, _APPS } from '@ConstantsModule'
import {
  getDisks,
  getHypervisor,
  isVmAvailableAction,
  nicsIncludesTheConnectionType,
} from '@ModelsModule'
import { PATH } from '@modules/components'
import { Translate } from '@modules/components/HOC'

const GUACAMOLE_BUTTONS = {
  [VM_ACTIONS.VNC]: { tooltip: T.Vnc, icon: <VncIcon /> },
  [VM_ACTIONS.SSH]: { tooltip: T.Ssh, icon: <SshIcon /> },
  [VM_ACTIONS.RDP]: { tooltip: T.Rdp, icon: <RdpIcon /> },
}

const openNewBrowserTab = (path) =>
  window?.open(`/fireedge/${_APPS.sunstone}${path}`, '_blank')

const GuacamoleButton = memo(({ vm, connectionType, onClick }) => {
  const { icon, tooltip } = GUACAMOLE_BUTTONS[connectionType]
  const history = useHistory()
  const [getSession, { isLoading }] = VmAPI.useLazyGetGuacamoleSessionQuery()
  const { zone, defaultZone } = useGeneral()

  const goToConsole = useCallback(
    async (evt) => {
      try {
        evt.stopPropagation()
        const params = { id: vm?.ID, type: connectionType }

        zone !== defaultZone && (params.zone = zone)

        if (typeof onClick === 'function') {
          const session = await getSession(params).unwrap()
          onClick(session)
        } else {
          const path = `${generatePath(PATH.GUACAMOLE, params)}?zone=${zone}`
          openNewBrowserTab(path)
        }
      } catch {}
    },
    [vm?.ID, connectionType, history, onClick, zone]
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

const PreConsoleButton = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.vm - Virtual machine
   * @param {'vnc'|'ssh'|'rdp'} props.connectionType - Connection type
   * @param {Function} [props.onClick] - Handle click for button
   * @returns {ReactElement} - Returns button if current user has permissions about the connection type
   */
  (props) => {
    const { vm, connectionType } = props
    const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()

    const isDisabled = useMemo(() => {
      const noAction = vmView?.actions?.[connectionType] !== true
      const noAvailable = !isVmAvailableAction(connectionType, vm)
      const notHypervisor = !getHypervisor(vm)
      const getDisk = !getDisks(vm)?.length

      return noAction || noAvailable || notHypervisor || getDisk
    }, [view, vm])

    const needNicConfig = useMemo(
      () => ![VM_ACTIONS.VNC].includes(connectionType),
      [connectionType]
    )

    if (
      isDisabled ||
      (needNicConfig && !nicsIncludesTheConnectionType(vm, connectionType))
    ) {
      return null
    }

    return <GuacamoleButton {...props} />
  }
)

const ButtonPropTypes = {
  vm: PropTypes.object,
  connectionType: PropTypes.string,
  onClick: PropTypes.func,
}

GuacamoleButton.propTypes = ButtonPropTypes
PreConsoleButton.propTypes = ButtonPropTypes

GuacamoleButton.displayName = 'GuacamoleButton'
PreConsoleButton.displayName = 'PreConsoleButton'

export { PreConsoleButton as ConsoleButton }
