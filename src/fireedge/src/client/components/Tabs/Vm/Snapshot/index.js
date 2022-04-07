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
import { Stack } from '@mui/material'

import { useGetVmQuery } from 'client/features/OneApi/vm'
import {
  CreateAction,
  RevertAction,
  DeleteAction,
} from 'client/components/Tabs/Vm/Snapshot/Actions'
import SnapshotCard from 'client/components/Cards/SnapshotCard'

import {
  getSnapshotList,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable } from 'client/models/Helper'
import { VM_ACTIONS } from 'client/constants'

const { SNAPSHOT_CREATE, SNAPSHOT_REVERT, SNAPSHOT_DELETE } = VM_ACTIONS

/**
 * Renders the list of snapshots from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @returns {ReactElement} Snapshots tab
 */
const VmSnapshotTab = ({ tabProps: { actions } = {}, id }) => {
  const { data: vm = {} } = useGetVmQuery(id)

  const [snapshots, actionsAvailable] = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter(
      (action) => !isAvailableAction(action)(vm)
    )

    return [getSnapshotList(vm), actionsByState]
  }, [vm])

  return (
    <div>
      {actionsAvailable?.includes(SNAPSHOT_CREATE) && (
        <CreateAction vmId={id} />
      )}

      <Stack direction="column" gap="1em" py="0.8em">
        {snapshots.map((snapshot) => (
          <SnapshotCard
            key={snapshot.SNAPSHOT_ID}
            extraActionProps={{ vmId: id }}
            actions={[
              actionsAvailable?.includes(SNAPSHOT_REVERT) && RevertAction,
              actionsAvailable?.includes(SNAPSHOT_DELETE) && DeleteAction,
            ].filter(Boolean)}
          />
        ))}
      </Stack>
    </div>
  )
}

VmSnapshotTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmSnapshotTab.displayName = 'VmSnapshotTab'

export default VmSnapshotTab
