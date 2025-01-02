/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useCallback, useMemo } from 'react'

import { ConsoleButton } from '@modules/components/Buttons'
import { VirtualMachineCard } from '@modules/components/Cards'
import { VM_ACTIONS, VM_EXTENDED_POOL } from '@ConstantsModule'
import { VmAPI, oneApi } from '@FeaturesModule'
import { jsonToXml } from '@ModelsModule'

const { VNC, RDP, SSH, VMRC } = VM_ACTIONS
const CONNECTION_TYPES = [VNC, RDP, SSH, VMRC]

const Row = memo(
  ({
    original,
    value,
    onClickLabel,
    globalErrors,
    headerList,
    rowDataCy,
    isSelected,
    toggleRowSelected,
    ...props
  }) => {
    const [update] = VmAPI.useUpdateUserTemplateMutation()

    const state = oneApi.endpoints.getVms.useQueryState(
      { extended: VM_EXTENDED_POOL },
      {
        selectFromResult: ({ data = [] }) =>
          data.find((vm) => +vm.ID === +original.ID),
      }
    )

    const memoVm = useMemo(() => state ?? original, [state, original])

    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoVm.USER_TEMPLATE?.LABELS?.split(',')
        const newLabels = currentLabels.filter((l) => l !== label).join(',')
        const newUserTemplate = { ...memoVm.USER_TEMPLATE, LABELS: newLabels }
        const templateXml = jsonToXml(newUserTemplate)

        update({ id: original.ID, template: templateXml, replace: 0 })
      },
      [memoVm.USER_TEMPLATE?.LABELS, update]
    )

    return (
      <VirtualMachineCard
        vm={memoVm}
        rootProps={props}
        onClickLabel={onClickLabel}
        onDeleteLabel={handleDeleteLabel}
        globalErrors={globalErrors}
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
  onClick: PropTypes.func,
  onClickLabel: PropTypes.func,
  globalErrors: PropTypes.array,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  toggleRowSelected: PropTypes.func,
}

Row.displayName = 'VirtualMachineRow'

export default Row
