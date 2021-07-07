import * as React from 'react'
import PropTypes from 'prop-types'

import StorageList from 'client/components/Tabs/Vm/Storage/List'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'

const VmStorageTab = ({ tabProps, ...data }) => {
  const { actions = [] } = tabProps

  const disks = VirtualMachine.getDisks(data)
  const hypervisor = VirtualMachine.getHypervisor(data)
  const actionsAvailable = Helper.getActionsAvailable(actions, hypervisor)

  return (
    <StorageList actions={actionsAvailable} disks={disks} />
  )
}

VmStorageTab.propTypes = {
  tabProps: PropTypes.shape({
    actions: PropTypes.object
  }),
  actions: PropTypes.array
}

VmStorageTab.displayName = 'VmStorageTab'

export default VmStorageTab
