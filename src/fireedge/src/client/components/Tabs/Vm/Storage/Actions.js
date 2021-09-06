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
import { memo, useContext } from 'react'
import PropTypes from 'prop-types'

import { Trash, Edit, UndoAction, SaveActionFloppy, Camera, Expand } from 'iconoir-react'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { SaveAsDiskForm, CreateDiskSnapshotForm, ResizeDiskForm } from 'client/components/Forms/Vm'

import { Tr } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const DetachAction = memo(({ disk, name: imageName }) => {
  const { DISK_ID } = disk
  const { detachDisk } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleDetach = async () => await detachDisk(vm.ID, DISK_ID)

  return (
    <ButtonToTriggerForm
      isConfirmDialog
      buttonProps={{
        'data-cy': `${VM_ACTIONS.DETACH_DISK}-${DISK_ID}`,
        icon: <Trash size={18} />,
        tooltip: Tr(T.Detach)
      }}
      dialogProps={{
        title: `${Tr(T.Detach)}: #${DISK_ID} - ${imageName}`,
        children: <p>{Tr(T.DoYouWantProceed)}</p>
      }}
      options={[{ onSubmit: handleDetach }]}
    />
  )
})

const SaveAsAction = memo(({ disk, snapshot, name: imageName }) => {
  const { DISK_ID: diskId } = disk
  const { ID: snapshotId, NAME: snapshotName } = snapshot ?? {}

  const { saveAsDisk } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const handleSaveAs = async ({ NAME } = {}) => {
    const data = { disk: diskId, name: NAME, snapshot: snapshotId }
    const response = await saveAsDisk(vm.ID, data)

    String(response) === String(vm.ID) && await handleRefetch?.(vm.ID)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.DISK_SAVEAS}-${diskId}`,
        icon: <SaveActionFloppy size={18} />,
        tooltip: Tr(T.SaveAs)
      }}
      dialogProps={{
        title: snapshot
          ? `${Tr(T.SaveAs)} ${Tr(T.Image)}: #${snapshotId} - ${snapshotName}`
          : `${Tr(T.SaveAs)} ${Tr(T.Image)}: #${diskId} - ${imageName}`
      }}
      options={[{
        form: SaveAsDiskForm,
        onSubmit: handleSaveAs
      }]}
    />
  )
})

const ResizeAction = memo(({ disk, name: imageName }) => {
  const { DISK_ID } = disk
  const { resizeDisk } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleResize = async ({ SIZE } = {}) => {
    const data = { disk: DISK_ID, size: SIZE }
    await resizeDisk(vm.ID, data)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.RESIZE_DISK}-${DISK_ID}`,
        icon: <Expand size={18} />,
        tooltip: Tr(T.Resize)
      }}
      dialogProps={{
        title: `${Tr(T.Resize)}: #${DISK_ID} - ${imageName}`
      }}
      options={[{
        form: () => ResizeDiskForm({ disk }),
        onSubmit: handleResize
      }]}
    />
  )
})

const SnapshotCreateAction = memo(({ disk, name: imageName }) => {
  const { DISK_ID } = disk
  const { createDiskSnapshot } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleSnapshotCreate = async ({ NAME } = {}) => {
    const data = { disk: DISK_ID, name: NAME }
    await createDiskSnapshot(vm.ID, data)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_CREATE}-${DISK_ID}`,
        icon: <Camera size={18} />,
        tooltip: Tr(T.TakeSnapshot)
      }}
      dialogProps={{
        title: `${Tr(T.TakeSnapshot)}: #${DISK_ID} - ${imageName}`
      }}
      options={[{
        form: CreateDiskSnapshotForm,
        onSubmit: handleSnapshotCreate
      }]}
    />
  )
})

const SnapshotRenameAction = memo(({ disk, snapshot }) => {
  const { DISK_ID } = disk
  const { ID, NAME = '' } = snapshot
  const { renameDiskSnapshot } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const handleRename = async ({ NAME: newName } = {}) => {
    const data = { disk: DISK_ID, snapshot: ID, name: newName }
    const response = await renameDiskSnapshot(vm.ID, data)

    String(response) === String(vm.ID) && await handleRefetch?.(vm.ID)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_RENAME}-${DISK_ID}-${ID}`,
        icon: <Edit size={18} />,
        tooltip: Tr(T.Edit)
      }}
      dialogProps={{
        title: `${Tr(T.Rename)}: #${ID} - ${NAME}`
      }}
      options={[{
        form: () => CreateDiskSnapshotForm({ snapshot }),
        onSubmit: handleRename
      }]}
    />
  )
})

const SnapshotRevertAction = memo(({ disk, snapshot }) => {
  const { DISK_ID } = disk
  const { ID, NAME = T.Snapshot } = snapshot
  const { revertDiskSnapshot } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleRevert = async () => {
    const data = { disk: DISK_ID, snapshot: ID }
    await revertDiskSnapshot(vm.ID, data)
  }

  return (
    <ButtonToTriggerForm
      isConfirmDialog
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_REVERT}-${DISK_ID}-${ID}`,
        icon: <UndoAction size={18} />,
        tooltip: Tr(T.Revert)
      }}
      dialogProps={{
        title: `${Tr(T.Revert)}: #${ID} - ${NAME}`,
        children: <p>{Tr(T.DoYouWantProceed)}</p>
      }}
      options={[{ onSubmit: handleRevert }]}
    />
  )
})

const SnapshotDeleteAction = memo(({ disk, snapshot }) => {
  const { DISK_ID } = disk
  const { ID, NAME = T.Snapshot } = snapshot
  const { deleteDiskSnapshot } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleDelete = async () => {
    const data = { disk: DISK_ID, snapshot: ID }
    await deleteDiskSnapshot(vm.ID, data)
  }

  return (
    <ButtonToTriggerForm
      isConfirmDialog
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_DELETE}-${DISK_ID}-${ID}`,
        icon: <Trash size={18} />,
        tooltip: Tr(T.Delete)
      }}
      dialogProps={{
        title: `${Tr(T.Delete)}: #${ID} - ${NAME}`,
        children: <p>{Tr(T.DoYouWantProceed)}</p>
      }}
      options={[{ onSubmit: handleDelete }]}
    />
  )
})

const ActionPropTypes = {
  disk: PropTypes.object,
  snapshot: PropTypes.object,
  name: PropTypes.string
}

DetachAction.propTypes = ActionPropTypes
DetachAction.displayName = 'DetachActionButton'
SaveAsAction.propTypes = ActionPropTypes
SaveAsAction.displayName = 'SaveAsActionButton'
ResizeAction.propTypes = ActionPropTypes
ResizeAction.displayName = 'ResizeActionButton'
SnapshotCreateAction.propTypes = ActionPropTypes
SnapshotCreateAction.displayName = 'SnapshotCreateActionButton'
SnapshotRenameAction.propTypes = ActionPropTypes
SnapshotRenameAction.displayName = 'SnapshotRenameActionButton'
SnapshotRevertAction.propTypes = ActionPropTypes
SnapshotRevertAction.displayName = 'SnapshotRevertActionButton'
SnapshotDeleteAction.propTypes = ActionPropTypes
SnapshotDeleteAction.displayName = 'SnapshotDeleteActionButton'

export {
  DetachAction,
  SaveAsAction,
  ResizeAction,
  SnapshotCreateAction,
  SnapshotDeleteAction,
  SnapshotRenameAction,
  SnapshotRevertAction
}
