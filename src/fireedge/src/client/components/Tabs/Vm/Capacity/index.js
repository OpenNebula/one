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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { useGetVmQuery, useResizeMutation } from 'client/features/OneApi/vm'
import InformationPanel from 'client/components/Tabs/Vm/Capacity/information'

import { getHypervisor, isAvailableAction } from 'client/models/VirtualMachine'
import { getActionsAvailable, jsonToXml } from 'client/models/Helper'

/**
 * Renders capacity tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @returns {ReactElement} Capacity tab
 */
const VmCapacityTab = ({ tabProps: { actions } = {}, id }) => {
  const [resizeCapacity] = useResizeMutation()
  const { data: vm = {} } = useGetVmQuery(id)

  const actionsAvailable = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isAvailableAction(action)(vm)
    )

    return actionsByState
  }, [vm])

  const handleResizeCapacity = async (formData) => {
    const { enforce, ...restOfData } = formData
    const template = jsonToXml(restOfData)

    await resizeCapacity({ id: vm.ID, enforce, template })
  }

  return (
    <InformationPanel
      actions={actionsAvailable}
      handleResizeCapacity={handleResizeCapacity}
      vm={vm}
    />
  )
}

VmCapacityTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmCapacityTab.displayName = 'VmCapacityTab'

export default VmCapacityTab
