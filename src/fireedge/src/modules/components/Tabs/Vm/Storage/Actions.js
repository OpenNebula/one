/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useGeneralApi, VmAPI } from '@FeaturesModule'

import {
  Trash,
  Edit,
  UndoAction,
  SaveActionFloppy,
  Camera,
  ExpandLines as Expand,
} from 'iconoir-react'

import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import {
  ImageSteps,
  VolatileSteps,
  SaveAsDiskForm,
  CreateDiskSnapshotForm,
  ResizeDiskForm,
} from '@modules/components/Forms/Vm'

import { jsonToXml } from '@ModelsModule'
import { Tr, Translate } from '@modules/components/HOC'
import { T, VM_ACTIONS, STYLE_BUTTONS } from '@ConstantsModule'
import { hasRestrictedAttributes, isRestrictedAttributes } from '@UtilsModule'

const AttachAction = memo(
  ({
    vmId,
    disk,
    hypervisor,
    onSubmit,
    sx,
    oneConfig,
    adminGroup,
    selectDiskId,
  }) => {
    const { setModifiedFields } = useGeneralApi()

    const handleFieldPathChange = useCallback(() => {
      setModifiedFields({}, { batch: false })
    }, [])

    const [attachDisk] = VmAPI.useAttachDiskMutation()
    const formConfig = {
      stepProps: { hypervisor, oneConfig, adminGroup, selectDiskId },
      initialValues: disk,
      onSubmitCallback: handleFieldPathChange,
    }

    const handleAttachDisk = async (formData) => {
      if (onSubmit && typeof onSubmit === 'function') {
        return await onSubmit(formData)
      }

      const template = jsonToXml({ DISK: formData })
      await attachDisk({ id: vmId, template })
    }

    return (
      <ButtonToTriggerForm
        buttonProps={
          disk
            ? {
                'data-cy': `edit-${disk.DISK_ID}`,
                icon: <Edit />,
                tooltip: Tr(T.Edit),
                sx,
              }
            : {
                'data-cy': 'add-disk',
                label: T.AttachDisk,
                sx,
                importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
              }
        }
        options={
          disk
            ? [
                {
                  dialogProps: {
                    title: (
                      <Translate word={T.EditSomething} values={[disk?.NAME]} />
                    ),
                    dataCy: 'modal-edit-disk',
                  },
                  form: () =>
                    !disk?.IMAGE && !disk?.IMAGE_ID // is volatile
                      ? VolatileSteps(formConfig)
                      : ImageSteps(formConfig),
                  onSubmit: handleAttachDisk,
                },
              ]
            : [
                {
                  cy: 'attach-image',
                  name: T.Image,
                  dialogProps: {
                    title: T.AttachImage,
                    dataCy: 'modal-attach-image',
                  },
                  form: () => ImageSteps(formConfig),
                  onSubmit: handleAttachDisk,
                },
                {
                  cy: 'attach-volatile',
                  name: T.Volatile,
                  dialogProps: {
                    title: T.AttachVolatile,
                    dataCy: 'modal-attach-volatile',
                  },
                  form: () => VolatileSteps(formConfig),
                  onSubmit: handleAttachDisk,
                },
              ]
        }
      />
    )
  }
)

const DetachAction = memo(
  ({ vmId, disk, name: imageName, onSubmit, sx, oneConfig, adminGroup }) => {
    const [detachDisk] = VmAPI.useDetachDiskMutation()
    const { DISK_ID } = disk

    const handleDetach = async () => {
      const handleDetachDisk = onSubmit ?? detachDisk
      await handleDetachDisk({ id: vmId, disk: DISK_ID })
    }

    // Disable action if is a regular user and is dettaching a disk in a template and if the disk has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      !vmId &&
      hasRestrictedAttributes(disk, 'DISK', oneConfig?.VM_RESTRICTED_ATTR)

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `${VM_ACTIONS.DETACH_DISK}-${DISK_ID}`,
          icon: <Trash />,
          tooltip: !disabledAction ? Tr(T.Detach) : Tr(T.DetachRestricted),
          sx,
          disabled: disabledAction,
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
  }
)

const SaveAsAction = memo(({ vmId, disk, snapshot, name: imageName, sx }) => {
  const [saveAsDisk] = VmAPI.useSaveAsDiskMutation()
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
        sx,
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
          form: SaveAsDiskForm,
          onSubmit: handleSaveAs,
        },
      ]}
    />
  )
})

const ResizeAction = memo(
  ({ vmId, disk, name: imageName, sx, oneConfig, adminGroup }) => {
    const [resizeDisk] = VmAPI.useResizeDiskMutation()
    const { DISK_ID } = disk

    const handleResize = async ({ SIZE } = {}) => {
      await resizeDisk({ id: vmId, disk: DISK_ID, size: SIZE })
    }

    const disabledAction =
      !adminGroup &&
      isRestrictedAttributes('SIZE', 'DISK', oneConfig?.VM_RESTRICTED_ATTR)

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `${VM_ACTIONS.RESIZE_DISK}-${DISK_ID}`,
          icon: <Expand />,
          tooltip: !disabledAction ? Tr(T.Resize) : Tr(T.ResizeRestricted),
          sx,
          disabled: disabledAction,
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
            form: () =>
              ResizeDiskForm({
                initialValues: disk,
                stepProps: {
                  oneConfig,
                  adminGroup,
                  nameParentAttribute: 'DISK',
                },
              }),
            onSubmit: handleResize,
          },
        ]}
      />
    )
  }
)

const SnapshotCreateAction = memo(({ vmId, disk, name: imageName, sx }) => {
  const [createDiskSnapshot] = VmAPI.useCreateDiskSnapshotMutation()
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
        sx,
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
            dataCy: 'modal-create-disk-snapshot',
            fixedHeight: '35vh',
            fixedWidth: '45vw',
          },
          form: CreateDiskSnapshotForm,
          onSubmit: handleSnapshotCreate,
        },
      ]}
    />
  )
})

const SnapshotRenameAction = memo(({ vmId, disk, snapshot, sx }) => {
  const [renameDiskSnapshot] = VmAPI.useRenameDiskSnapshotMutation()
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
        tooltip: Tr(T.Rename),
        sx,
      }}
      options={[
        {
          dialogProps: {
            title: (
              <Translate word={T.RenameSomething} values={`#${ID} - ${NAME}`} />
            ),
            dataCy: 'modal-rename-disk-snapshot',
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          form: () => CreateDiskSnapshotForm({ initialValues: snapshot }),
          onSubmit: handleRename,
        },
      ]}
    />
  )
})

const SnapshotRevertAction = memo(({ vmId, disk, snapshot, sx }) => {
  const [revertDiskSnapshot] = VmAPI.useRevertDiskSnapshotMutation()
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
        sx,
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

const SnapshotDeleteAction = memo(({ vmId, disk, snapshot, sx }) => {
  const [deleteDiskSnapshot] = VmAPI.useDeleteDiskSnapshotMutation()
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
        sx,
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
  vmId: PropTypes.string,
  hypervisor: PropTypes.string,
  disk: PropTypes.object,
  snapshot: PropTypes.object,
  name: PropTypes.string,
  onSubmit: PropTypes.func,
  sx: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  selectDiskId: PropTypes.number,
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
