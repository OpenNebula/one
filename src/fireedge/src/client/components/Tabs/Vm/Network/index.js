import * as React from 'react'
import PropTypes from 'prop-types'

import NetworkList from 'client/components/Tabs/Vm/Network/List'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'

const VmNetworkTab = ({ tabProps, ...data }) => {
  const { actions = [] } = tabProps

  const nics = VirtualMachine.getNics(data, { groupAlias: true })
  const hypervisor = VirtualMachine.getHypervisor(data)
  const actionsAvailable = Helper.getActionsAvailable(actions, hypervisor)

  return (
    <NetworkList actions={actionsAvailable} nics={nics} />
  )
}

VmNetworkTab.propTypes = {
  tabProps: PropTypes.shape({
    actions: PropTypes.object
  }),
  actions: PropTypes.array
}

VmNetworkTab.displayName = 'VmNetworkTab'

export default VmNetworkTab
