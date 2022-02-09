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
/* eslint-disable jsdoc/require-jsdoc */
import { useContext, useMemo } from 'react'
import PropTypes from 'prop-types'

import { TabContext } from 'client/components/Tabs/TabProvider'
import HistoryList from 'client/components/Tabs/Vm/History/List'

import {
  getHypervisor,
  getHistoryRecords,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable } from 'client/models/Helper'

const VmHistoryTab = ({ tabProps: { actions } = {} }) => {
  const { data: vm } = useContext(TabContext)

  const [records, actionsAvailable] = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter(
      (action) => !isAvailableAction(action)(vm)
    )

    return [getHistoryRecords(vm), actionsByState]
  }, [vm])

  return <HistoryList actions={actionsAvailable} records={records} />
}

VmHistoryTab.propTypes = {
  tabProps: PropTypes.object,
}

VmHistoryTab.displayName = 'VmHistoryTab'

export default VmHistoryTab
