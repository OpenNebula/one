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
