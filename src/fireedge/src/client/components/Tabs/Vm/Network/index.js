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
import * as React from 'react'
import PropTypes from 'prop-types'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'

import NetworkList from 'client/components/Tabs/Vm/Network/List'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { AttachNicForm } from 'client/components/Forms/Vm'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { mapUserInputs } from 'client/utils'
import { T, VM_ACTIONS } from 'client/constants'

const VmNetworkTab = ({ tabProps = {} }) => {
  const { attachNic } = useVmApi()

  const { handleRefetch, data: vm } = React.useContext(TabContext)
  const { actions = [] } = tabProps

  const nics = VirtualMachine.getNics(vm, {
    groupAlias: true,
    securityGroupsFromTemplate: true
  })

  const hypervisor = VirtualMachine.getHypervisor(vm)
  const actionsAvailable = Helper.getActionsAvailable(actions, hypervisor)

  const handleAttachNic = async ({ network, advanced }) => {
    const networkSelected = network?.[0]
    const isAlias = !!advanced?.PARENT?.length
    const root = { ...networkSelected, ...mapUserInputs(advanced) }

    const template = Helper.jsonToXml({
      [isAlias ? 'NIC_ALIAS' : 'NIC']: root
    })

    const response = await attachNic(vm.ID, template)
    String(response) === String(vm.ID) && await handleRefetch?.()
  }

  return (
    <>
      {actionsAvailable?.includes?.(VM_ACTIONS.ATTACH_NIC) && (
        <ButtonToTriggerForm
          buttonProps={{ 'data-cy': 'attach-nic' }}
          title={T.AttachNic}
          options={[{
            form: AttachNicForm({ nics }),
            onSubmit: handleAttachNic
          }]}
        />
      )}

      <NetworkList actions={actionsAvailable} nics={nics} />
    </>
  )
}

VmNetworkTab.propTypes = {
  tabProps: PropTypes.object
}

VmNetworkTab.displayName = 'VmNetworkTab'

export default VmNetworkTab
