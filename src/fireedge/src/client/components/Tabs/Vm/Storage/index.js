/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import DiskCard from 'client/components/Cards/DiskCard'
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
import Graphs from 'client/components/Tabs/Vm/Storage/Graphs'

import {
  getDisks,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getDiskName } from 'client/models/Image'
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
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Storage tab
 */
const VmStorageTab = ({
  tabProps: { actions } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const { data: vm = {} } = useGetVmQuery({ id })

  const [disks, hypervisor, actionsAvailable] = useMemo(() => {
    const hyperV = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hyperV)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isAvailableAction(action, vm)
    )

    return [getDisks(vm), hyperV, actionsByState]
  }, [vm])

  return (
    <div>
      {actionsAvailable?.includes?.(ATTACH_DISK) && (
        <AttachAction
          vmId={id}
          hypervisor={hypervisor}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
        />
      )}

      <Stack gap="1em" py="0.8em">
        {disks.map((disk) => {
          const isImage = disk.IMAGE_ID !== undefined
          const imageName = getDiskName(disk)
          const diskActionProps = { vmId: id, disk, name: imageName }

          return (
            <DiskCard
              key={disk.DISK_ID}
              vmId={id}
              disk={disk}
              actions={
                <>
                  {isImage && actionsAvailable.includes(DISK_SAVEAS) && (
                    <SaveAsAction {...diskActionProps} />
                  )}
                  {actionsAvailable.includes(SNAPSHOT_DISK_CREATE) && (
                    <SnapshotCreateAction {...diskActionProps} />
                  )}
                  {actionsAvailable.includes(RESIZE_DISK) && (
                    <ResizeAction {...diskActionProps} />
                  )}
                  {actionsAvailable.includes(DETACH_DISK) && (
                    <DetachAction {...diskActionProps} />
                  )}
                </>
              }
              snapshotActions={({ snapshot }) => (
                <>
                  {isImage && actionsAvailable.includes(DISK_SAVEAS) && (
                    <SaveAsAction {...diskActionProps} snapshot={snapshot} />
                  )}
                  {actionsAvailable.includes(SNAPSHOT_DISK_RENAME) && (
                    <SnapshotRenameAction
                      {...diskActionProps}
                      snapshot={snapshot}
                    />
                  )}
                  {actionsAvailable.includes(SNAPSHOT_DISK_REVERT) && (
                    <SnapshotRevertAction
                      {...diskActionProps}
                      snapshot={snapshot}
                    />
                  )}
                  {actionsAvailable.includes(SNAPSHOT_DISK_DELETE) && (
                    <SnapshotDeleteAction
                      {...diskActionProps}
                      snapshot={snapshot}
                    />
                  )}
                </>
              )}
            />
          )
        })}
      </Stack>
      <Graphs id={id} />
    </div>
  )
}

VmStorageTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VmStorageTab.displayName = 'VmStorageTab'

export default VmStorageTab
