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
import {
  nicsIncludesTheConnectionType,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { Translate } from 'client/components/HOC'
import { T, VM, RESOURCE_NAMES, VM_ACTIONS } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routes'

const GUACAMOLE_BUTTON = {
  vnc: { tooltip: T.Vnc, icon: <VncIcon /> },
  ssh: { tooltip: T.Ssh, icon: <SshIcon /> },
  rdp: { tooltip: T.Rdp, icon: <RdpIcon /> },
}

const GuacamoleButton = memo(
  /**
   * @param {object} options - Options
   * @param {VM} options.vm - Virtual machine
   * @param {'vnc'|'ssh'|'rdp'} options.connectionType - Connection type
   * @param {Function} [options.onClick] - Handle click for button
   * @returns {ReactElement} - Guacamole button
   */
  ({ vm, connectionType, onClick }) => {
    const history = useHistory()
    const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()
    const [getSession, { isLoading }] = useLazyGetGuacamoleSessionQuery()

    const isDisabled = useMemo(() => {
      const noAction = vmView?.actions?.[connectionType] !== true
      const noAvailable = isAvailableAction(connectionType)(vm)

      return noAction || noAvailable
    }, [view, vm])

    const { tooltip, icon } = GUACAMOLE_BUTTON[connectionType]

    const goToConsole =
      onClick ??
      useCallback(
        async (evt) => {
          try {
            evt.stopPropagation()

            const params = { id: vm?.ID, type: connectionType }
            await getSession(params)
            history.push(generatePath(PATH.GUACAMOLE, params))
          } catch {}
        },
        [vm?.ID, connectionType, history]
      )

    if (
      isDisabled ||
      (connectionType !== VM_ACTIONS.VNC &&
        !nicsIncludesTheConnectionType(vm, connectionType))
    ) {
      return null
    }

    return (
      <SubmitButton
        data-cy={`${vm?.ID}-${connectionType}`}
        icon={icon}
        tooltip={<Translate word={tooltip} />}
        isSubmitting={isLoading}
        onClick={goToConsole}
      />
    )
  }
)

GuacamoleButton.propTypes = {
  vm: PropTypes.object,
  connectionType: PropTypes.string,
  onClick: PropTypes.func,
}

GuacamoleButton.displayName = 'GuacamoleButton'

export { GuacamoleButton }
