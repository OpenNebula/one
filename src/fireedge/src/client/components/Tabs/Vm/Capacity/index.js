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
/* eslint-disable jsdoc/require-jsdoc */
import { useContext, useMemo } from 'react'
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import InformationPanel from 'client/components/Tabs/Vm/Capacity/information'

import { getHypervisor, isAvailableAction } from 'client/models/VirtualMachine'
import { getActionsAvailable, jsonToXml } from 'client/models/Helper'

const VmCapacityTab = ({ tabProps: { actions } = {} }) => {
  const { resize } = useVmApi()

  const { handleRefetch, data: vm = {} } = useContext(TabContext)
  const { ID } = vm

  const actionsAvailable = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor
      .filter(action => !isAvailableAction(action)(vm))

    return actionsByState
  }, [vm])

  const handleResizeCapacity = async formData => {
    const { enforce, ...restOfData } = formData
    const template = jsonToXml(restOfData)

    const response = await resize(ID, { enforce, template })
    String(response) === String(ID) && (await handleRefetch?.())
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
  tabProps: PropTypes.object
}

VmCapacityTab.displayName = 'VmCapacityTab'

export default VmCapacityTab
