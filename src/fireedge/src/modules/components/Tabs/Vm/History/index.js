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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { VmAPI } from '@FeaturesModule'
import HistoryRecord from '@modules/components/Tabs/Vm/History/HistoryRecord'

import {
  getHypervisor,
  getHistoryRecords,
  isVmAvailableAction,
  getActionsAvailable,
} from '@ModelsModule'

/**
 * Renders the list of history records from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @returns {ReactElement} History tab
 */
const VmHistoryTab = ({ tabProps: { actions } = {}, id }) => {
  const { data: vm = {} } = VmAPI.useGetVmQuery({ id })

  const [records, actionsAvailable] = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isVmAvailableAction(action, vm)
    )

    return [getHistoryRecords(vm), actionsByState]
  }, [vm])

  return (
    <div
      style={{ display: 'grid', gap: '1em', paddingBlock: '0.8em' }}
      data-cy="history"
    >
      {records.map((history, idx) => (
        <HistoryRecord key={idx} history={history} actions={actionsAvailable} />
      ))}
    </div>
  )
}

VmHistoryTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmHistoryTab.displayName = 'VmHistoryTab'

export default VmHistoryTab
