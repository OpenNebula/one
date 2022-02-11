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
import { memo } from 'react'
import PropTypes from 'prop-types'

import {
  Trash,
  Edit,
  UndoAction,
  SaveActionFloppy,
  Camera,
  Expand,
} from 'iconoir-react'

import {
  useAttachDiskMutation,
  useDetachDiskMutation,
  useSaveAsDiskMutation,
  useResizeDiskMutation,
  useCreateDiskSnapshotMutation,
  useRenameDiskSnapshotMutation,
  useRevertDiskSnapshotMutation,
  useDeleteDiskSnapshotMutation,
} from 'client/features/OneApi/vm'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import {
  ImageSteps,
  VolatileSteps,
  SaveAsDiskForm,
  CreateDiskSnapshotForm,
  ResizeDiskForm,
} from 'client/components/Forms/Vm'

import { jsonToXml } from 'client/models/Helper'
import { Tr, Translate } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const AttachAction = memo(({ vmId, hypervisor }) => {
  const [attachDisk] = useAttachDiskMutation()

  const handleAttachDisk = async (formData) => {
    const template = jsonToXml({ DISK: formData })
    await attachDisk({ id: vmId, template })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        color: 'secondary',
        'data-cy': 'attach-disk',
        label: T.AttachDisk,
        variant: 'outlined',
      }}
      options={[
        {
          cy: 'attach-image',
          name: T.Image,
          dialogProps: { title: T.AttachImage },
          form: () => ImageSteps({ hypervisor }),
          onSubmit: handleAttachDisk,
        },
        {
          cy: 'attach-volatile',
          name: T.Volatile,
          dialogProps: { title: T.AttachVolatile },
          form: () => VolatileSteps({ hypervisor }),
          onSubmit: handleAttachDisk,
        },
      ]}
    />
  )
})

const DetachAction = memo(({ vmId, disk, name: imageName }) => {
  const [detachDisk] = useDetachDiskMutation()
  const { DISK_ID } = disk

  const handleDetach = async () => {
    await detachDisk({ id: vmId, disk: DISK_ID })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.DETACH_DISK}-${DISK_ID}`,
        icon: <Trash />,
        tooltip: Tr(T.Detach),
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate
                word={T.DetachSomething}
                values={`#${DISK_ID} - ${imageName}`}
              />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit: handleDetach,
        },
      ]}
    />
  )
})

const SaveAsAction = memo(({ vmId, disk, snapshot, name: imageName }) => {
  const [saveAsDisk] = useSaveAsDiskMutation()
  const { DISK_ID: diskId } = disk
  const { ID: snapshotId, NAME: snapshotName } = snapshot ?? {}

  const handleSaveAs = async ({ NAME } = {}) => {
    await saveAsDisk({
      id: vmId,
      disk: diskId,
      name: NAME,
      snapshot: snapshotId,
    })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.DISK_SAVEAS}-${diskId}`,
        icon: <SaveActionFloppy />,
        tooltip: Tr(T.SaveAs),
      }}
      options={[
        {
          dialogProps: {
            title: snapshot ? (
              <Translate
                word={T.SaveAsImage}
                values={`#${snapshotId} - ${snapshotName}`}
              />
            ) : (
              <Translate
                word={T.SaveAsImage}
                values={`#${diskId} - ${imageName}`}
              />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          form: () => SaveAsDiskForm(),
          onSubmit: handleSaveAs,
        },
      ]}
    />
  )
})

const ResizeAction = memo(({ vmId, disk, name: imageName }) => {
  const [resizeDisk] = useResizeDiskMutation()
  const { DISK_ID } = disk

  const handleResize = async ({ SIZE } = {}) => {
    await resizeDisk({ id: vmId, disk: DISK_ID, size: SIZE })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.RESIZE_DISK}-${DISK_ID}`,
        icon: <Expand />,
        tooltip: Tr(T.Resize),
      }}
      options={[
        {
          dialogProps: {
            title: (
              <Translate
                word={T.ResizeSomething}
                values={`#${DISK_ID} - ${imageName}`}
              />
            ),
          },
          form: () => ResizeDiskForm(undefined, disk),
          onSubmit: handleResize,
        },
      ]}
    />
  )
})

const SnapshotCreateAction = memo(({ vmId, disk, name: imageName }) => {
  const [createDiskSnapshot] = useCreateDiskSnapshotMutation()
  const { DISK_ID } = disk

  const handleSnapshotCreate = async ({ NAME } = {}) => {
    await createDiskSnapshot({ id: vmId, disk: DISK_ID, name: NAME })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_CREATE}-${DISK_ID}`,
        icon: <Camera />,
        tooltip: Tr(T.TakeSnapshot),
      }}
      options={[
        {
          dialogProps: {
            title: (
              <Translate
                word={T.TakeSnapshotSomething}
                values={`#${DISK_ID} - ${imageName}`}
              />
            ),
          },
          form: () => CreateDiskSnapshotForm(),
          onSubmit: handleSnapshotCreate,
        },
      ]}
    />
  )
})

const SnapshotRenameAction = memo(({ vmId, disk, snapshot }) => {
  const [renameDiskSnapshot] = useRenameDiskSnapshotMutation()
  const { DISK_ID } = disk
  const { ID, NAME = '' } = snapshot

  const handleRename = async ({ NAME: newName } = {}) => {
    await renameDiskSnapshot({
      id: vmId,
      disk: DISK_ID,
      snapshot: ID,
      name: newName,
    })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_RENAME}-${DISK_ID}-${ID}`,
        icon: <Edit />,
        tooltip: Tr(T.Edit),
      }}
      options={[
        {
          dialogProps: {
            title: (
              <Translate word={T.RenameSomething} values={`#${ID} - ${NAME}`} />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          form: () => CreateDiskSnapshotForm(undefined, snapshot),
          onSubmit: handleRename,
        },
      ]}
    />
  )
})

const SnapshotRevertAction = memo(({ vmId, disk, snapshot }) => {
  const [revertDiskSnapshot] = useRevertDiskSnapshotMutation()
  const { DISK_ID } = disk
  const { ID, NAME = T.Snapshot } = snapshot

  const handleRevert = async () => {
    await revertDiskSnapshot({ id: vmId, disk: DISK_ID, snapshot: ID })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_REVERT}-${DISK_ID}-${ID}`,
        icon: <UndoAction />,
        tooltip: Tr(T.Revert),
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate word={T.RevertSomething} values={`#${ID} - ${NAME}`} />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit: handleRevert,
        },
      ]}
    />
  )
})

const SnapshotDeleteAction = memo(({ vmId, disk, snapshot }) => {
  const [deleteDiskSnapshot] = useDeleteDiskSnapshotMutation()
  const { DISK_ID } = disk
  const { ID, NAME = T.Snapshot } = snapshot

  const handleDelete = async () => {
    await deleteDiskSnapshot({ id: vmId, disk: DISK_ID, snapshot: ID })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DISK_DELETE}-${DISK_ID}-${ID}`,
        icon: <Trash />,
        tooltip: Tr(T.Delete),
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate word={T.DeleteSomething} values={`#${ID} - ${NAME}`} />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit: handleDelete,
        },
      ]}
    />
  )
})

const ActionPropTypes = {
  vmId: PropTypes.string.isRequired,
  hypervisor: PropTypes.string,
  disk: PropTypes.object,
  snapshot: PropTypes.object,
  name: PropTypes.string,
}

AttachAction.propTypes = ActionPropTypes
AttachAction.displayName = 'AttachActionButton'
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
  AttachAction,
  DetachAction,
  SaveAsAction,
  ResizeAction,
  SnapshotCreateAction,
  SnapshotDeleteAction,
  SnapshotRenameAction,
  SnapshotRevertAction,
}
