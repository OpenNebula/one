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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { useGetVmQuery } from 'client/features/OneApi/vm'
import {
  AttachAction,
  SaveAsAction,
  ResizeAction,
  DetachAction,
  SnapshotCreateAction,
  SnapshotRevertAction,
  SnapshotRenameAction,
  SnapshotDeleteAction,
} from 'client/components/Tabs/Vm/Storage/Actions'
import DiskCard from 'client/components/Cards/DiskCard'

import {
  getDisks,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable } from 'client/models/Helper'
import { VM_ACTIONS } from 'client/constants'

const {
  ATTACH_DISK,
  DETACH_DISK,
  DISK_SAVEAS,
  RESIZE_DISK,
  SNAPSHOT_DISK_CREATE,
  SNAPSHOT_DISK_RENAME,
  SNAPSHOT_DISK_REVERT,
  SNAPSHOT_DISK_DELETE,
} = VM_ACTIONS

/**
 * Renders the list of disks from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @returns {ReactElement} Storage tab
 */
const VmStorageTab = ({ tabProps: { actions } = {}, id }) => {
  const { data: vm = {} } = useGetVmQuery(id)

  const [disks, hypervisor, actionsAvailable] = useMemo(() => {
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter(
      (action) => !isAvailableAction(action)(vm)
    )

    return [getDisks(vm), hyperV, actionsByState]
  }, [vm])

  const filterByAvailable = (action, button) =>
    actionsAvailable.includes(action) && button

  return (
    <>
      {actionsAvailable?.includes?.(ATTACH_DISK) && (
        <AttachAction vmId={id} hypervisor={hypervisor} />
      )}

      <Stack direction="column" gap="1em" py="0.8em">
        {disks.map((disk) => {
          const isImage = disk.IMAGE_ID !== undefined

          return (
            <DiskCard
              key={disk.DISK_ID}
              vmId={id}
              disk={disk}
              extraActionProps={{ vmId: id }}
              extraSnapshotActionProps={{ disk, vmId: id }}
              actions={[
                isImage && filterByAvailable(DISK_SAVEAS, SaveAsAction),
                filterByAvailable(SNAPSHOT_DISK_CREATE, SnapshotCreateAction),
                filterByAvailable(RESIZE_DISK, ResizeAction),
                filterByAvailable(DETACH_DISK, DetachAction),
              ].filter(Boolean)}
              snapshotActions={[
                isImage && filterByAvailable(DISK_SAVEAS, SaveAsAction),
                filterByAvailable(SNAPSHOT_DISK_RENAME, SnapshotRenameAction),
                filterByAvailable(SNAPSHOT_DISK_REVERT, SnapshotRevertAction),
                filterByAvailable(SNAPSHOT_DISK_DELETE, SnapshotDeleteAction),
              ].filter(Boolean)}
            />
          )
        })}
      </Stack>
    </>
  )
}

VmStorageTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmStorageTab.displayName = 'VmStorageTab'

export default VmStorageTab
