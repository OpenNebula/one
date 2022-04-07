/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import vmApi from 'client/features/OneApi/vm'
import { VirtualMachineCard } from 'client/components/Cards'
import { ConsoleButton } from 'client/components/Buttons'
import { VM_ACTIONS } from 'client/constants'

const { VNC, RDP, SSH, VMRC } = VM_ACTIONS
const CONNECTION_TYPES = [VNC, RDP, SSH, VMRC]

const Row = memo(
  ({ original, ...props }) => {
    const state = vmApi.endpoints.getVms.useQueryState(undefined, {
      selectFromResult: ({ data = [] }) =>
        data.find((vm) => +vm.ID === +original.ID),
    })

    const memoVm = useMemo(() => state ?? original, [state, original])

    return (
      <VirtualMachineCard
        vm={memoVm}
        rootProps={props}
        actions={
          <>
            {CONNECTION_TYPES.map((connectionType) => (
              <ConsoleButton
                key={`${memoVm}-${connectionType}`}
                connectionType={connectionType}
                vm={memoVm}
              />
            ))}
          </>
        }
      />
    )
  },
  (prev, next) => prev.className === next.className
)

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  className: PropTypes.string,
  handleClick: PropTypes.func,
}

Row.displayName = 'VirtualMachineRow'

export default Row
