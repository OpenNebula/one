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
import { useContext } from 'react'
import PropTypes from 'prop-types'

import { useAuth } from 'client/features/Auth'
import { TabContext } from 'client/components/Tabs/TabProvider'
import { CreateSchedAction, CharterAction } from 'client/components/Tabs/Vm/SchedActions/Actions'
import SchedulingList from 'client/components/Tabs/Vm/SchedActions/List'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { VM_ACTIONS } from 'client/constants'

const VmSchedulingTab = ({ tabProps: { actions } = {} }) => {
  const { config } = useAuth()
  const { data: vm } = useContext(TabContext)

  const scheduling = VirtualMachine.getScheduleActions(vm)
  const hypervisor = VirtualMachine.getHypervisor(vm)
  const actionsAvailable = Helper.getActionsAvailable(actions, hypervisor)

  return (
    <>
      {actionsAvailable?.includes?.(VM_ACTIONS.SCHED_ACTION_CREATE) && (
        <CreateSchedAction />
      )}
      {actionsAvailable?.includes?.(VM_ACTIONS.CHARTER_CREATE) && config?.leases && (
        <CharterAction />
      )}

      <SchedulingList actions={actionsAvailable} scheduling={scheduling} />
    </>
  )
}

VmSchedulingTab.propTypes = {
  tabProps: PropTypes.object
}

VmSchedulingTab.displayName = 'VmSchedulingTab'

export default VmSchedulingTab
