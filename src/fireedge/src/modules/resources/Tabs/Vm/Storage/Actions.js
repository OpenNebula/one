/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { useGeneralApi, VmAPI, useModalsApi } from '@FeaturesModule'

import {
  Trash,
  Edit,
  UndoAction,
  SaveActionFloppy,
  Camera,
  ExpandLines as Expand,
  NavArrowDown,
} from 'iconoir-react'

import { SubmitButton } from '@ComponentsV2Module'
import { Menu, MenuItem } from '@mui/material'
import {
  ImageSteps,
  VolatileSteps,
  SaveAsDiskForm,
  CreateDiskSnapshotForm,
  ResizeDiskForm,
} from '@modules/resources/resources/VirtualMachine/Forms'

import {
  jsonToXml,
  hasRestrictedAttributes,
  isRestrictedAttributes,
} from '@UtilsModule'
import { Translate } from '@ProvidersModule'

import { T, VM_ACTIONS, STYLE_BUTTONS } from '@ConstantsModule'

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
    const [menuAnchor, setMenuAnchor] = useState(null)
    const menuOpen = Boolean(menuAnchor)

    const handleOpenMenu = (event) => setMenuAnchor(event.currentTarget)
    const handleCloseMenu = () => setMenuAnchor(null)

    const { setModifiedFields } = useGeneralApi()
    const { showModal } = useModalsApi()

    const handleOpenForm = (e) =>
      disk
        ? showModal({
            id: 'vm-storage-edit-disk',
            dialogProps: {
              title: <Translate word={T.EditSomething} values={[disk?.NAME]} />,
              dataCy: 'modal-edit-disk',
            },
            form:
              !disk?.IMAGE && !disk?.IMAGE_ID // is volatile
                ? VolatileSteps(formConfig)
                : ImageSteps(formConfig),
            onSubmit: handleAttachDisk,
          })
        : handleOpenMenu(e)

    const handleOpenAttachImage = () =>
      showModal({
        id: 'vm-storage-attach-image',
        cy: 'attach-image',
        name: T.Image,
        dialogProps: {
          title: T.AttachImage,
          dataCy: 'modal-attach-image',
        },
        form: ImageSteps(formConfig),
        onSubmit: handleAttachDisk,
      })

    const handleOpenAttachVolatile = () =>
      showModal({
        id: 'vm-storage-attach-volatile',
        cy: 'attach-volatile',
        name: T.Volatile,
        dialogProps: {
          title: T.AttachVolatile,
          dataCy: 'modal-attach-volatile',
        },
        form: VolatileSteps(formConfig),
        onSubmit: handleAttachDisk,
      })

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
      <>
        <SubmitButton
          {...(disk
            ? {
                'data-cy': `edit-${disk.DISK_ID}`,
                iconOnly: <Edit />,
                tooltip: T.Edit,
              }
            : {
                'data-cy': 'add-disk',
                label: T.AttachDisk,
                variant: STYLE_BUTTONS.TYPE.PRIMARY,
              })}
          endIcon={<NavArrowDown />}
          onClick={(event) => {
            handleOpenForm(event)
          }}
        />

        <Menu
          id="storage-attach-menu"
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={handleCloseMenu}
        >
          <MenuItem data-cy={'attach-image'} onClick={handleOpenAttachImage}>
            {T.Image}
          </MenuItem>
          <MenuItem
            data-cy={'attach-volatile'}
            onClick={handleOpenAttachVolatile}
          >
            {T.Volatile}
          </MenuItem>
        </Menu>
      </>
    )
  }
)

const DetachAction = memo(
  ({ vmId, disk, name: imageName, onSubmit, sx, oneConfig, adminGroup }) => {
    const { showModal } = useModalsApi()
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

    const openDetachForm = () =>
      showModal({
        isConfirmDialog: true,
        dialogProps: {
          title: `${T.DetachSomething} #${DISK_ID} - ${imageName}`,
          children: <p>{T.DoYouWantProceed}</p>,
        },
        onSubmit: handleDetach,
      })

    return (
      <SubmitButton
        data-cy={`${VM_ACTIONS.DETACH_DISK}-${DISK_ID}`}
        iconOnly={<Trash />}
        tooltip={!disabledAction ? T.Detach : T.DetachRestricted}
        disabled={disabledAction}
        onClick={openDetachForm}
      />
    )
  }
)

const SaveAsAction = memo(({ vmId, disk, snapshot, name: imageName, sx }) => {
  const [saveAsDisk] = VmAPI.useSaveAsDiskMutation()
  const { DISK_ID: diskId } = disk
  const { ID: snapshotId, NAME: snapshotName } = snapshot ?? {}
  const { showModal } = useModalsApi()

  const handleSaveAs = async ({ NAME } = {}) => {
    await saveAsDisk({
      id: vmId,
      disk: diskId,
      name: NAME,
      snapshot: snapshotId,
    })
  }

  const openSaveDiskForm = () =>
    showModal({
      dialogProps: {
        title: (
          <Translate
            word={T.SaveAsImage}
            values={`#${snapshot ? snapshotId : diskId} - ${
              snapshot ? snapshotName : imageName
            }`}
          />
        ),
        children: <p>{T.DoYouWantProceed}</p>,
      },
      form: SaveAsDiskForm,
      onSubmit: handleSaveAs,
    })

  return (
    <SubmitButton
      data-cy={`${VM_ACTIONS.DISK_SAVEAS}-${diskId}`}
      iconOnly={<SaveActionFloppy />}
      tooltip={T.SaveAs}
      onClick={openSaveDiskForm}
    />
  )
})

const ResizeAction = memo(
  ({ vmId, disk, name: imageName, sx, oneConfig, adminGroup }) => {
    const { showModal } = useModalsApi()
    const [resizeDisk] = VmAPI.useResizeDiskMutation()
    const { DISK_ID } = disk

    const handleResize = async ({ SIZE } = {}) => {
      await resizeDisk({ id: vmId, disk: DISK_ID, size: SIZE })
    }

    const disabledAction =
      !adminGroup &&
      isRestrictedAttributes('SIZE', 'DISK', oneConfig?.VM_RESTRICTED_ATTR)

    const openResizeForm = () =>
      showModal({
        dialogProps: {
          title: (
            <Translate
              word={T.ResizeSomething}
              values={`#${DISK_ID} - ${imageName}`}
            />
          ),
        },
        form: ResizeDiskForm({
          initialValues: disk,
          stepProps: {
            oneConfig,
            adminGroup,
            nameParentAttribute: 'DISK',
          },
        }),
        onSubmit: handleResize,
      })

    return (
      <SubmitButton
        data-cy={`${VM_ACTIONS.RESIZE_DISK}-${DISK_ID}`}
        iconOnly={<Expand />}
        tooltip={!disabledAction ? T.Resize : T.ResizeRestricted}
        disabled={disabledAction}
        onClick={openResizeForm}
      />
    )
  }
)

const SnapshotCreateAction = memo(({ vmId, disk, name: imageName, sx }) => {
  const { showModal } = useModalsApi()
  const [createDiskSnapshot] = VmAPI.useCreateDiskSnapshotMutation()
  const { DISK_ID } = disk

  const handleSnapshotCreate = async ({ NAME } = {}) => {
    await createDiskSnapshot({ id: vmId, disk: DISK_ID, name: NAME })
  }

  const openSnapshotForm = () =>
    showModal({
      dialogProps: {
        title: (
          <Translate
            word={T.TakeSnapshotSomething}
            values={`#${DISK_ID} - ${imageName}`}
          />
        ),
        dataCy: 'modal-create-disk-snapshot',
      },
      form: CreateDiskSnapshotForm,
      onSubmit: handleSnapshotCreate,
    })

  return (
    <SubmitButton
      data-cy={`${VM_ACTIONS.SNAPSHOT_DISK_CREATE}-${DISK_ID}`}
      iconOnly={<Camera />}
      tooltip={T.TakeSnapshot}
      onClick={openSnapshotForm}
    />
  )
})

const SnapshotRenameAction = memo(({ vmId, disk, snapshot, sx }) => {
  const { showModal } = useModalsApi()
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

  const openSnapshotRenameForm = () =>
    showModal({
      dialogProps: {
        title: (
          <Translate word={T.RenameSomething} values={`#${ID} - ${NAME}`} />
        ),
        dataCy: 'modal-rename-disk-snapshot',
        children: <p>{T.DoYouWantProceed}</p>,
      },
      form: CreateDiskSnapshotForm({ initialValues: snapshot }),
      onSubmit: handleRename,
    })

  return (
    <SubmitButton
      data-cy={`${VM_ACTIONS.SNAPSHOT_DISK_RENAME}-${DISK_ID}-${ID}`}
      iconOnly={<Edit />}
      tooltip={T.Rename}
      onClick={openSnapshotRenameForm}
    />
  )
})

const SnapshotRevertAction = memo(({ vmId, disk, snapshot, sx }) => {
  const { showModal } = useModalsApi()
  const [revertDiskSnapshot] = VmAPI.useRevertDiskSnapshotMutation()
  const { DISK_ID } = disk
  const { ID, NAME = T.Snapshot } = snapshot

  const handleRevert = async () => {
    await revertDiskSnapshot({ id: vmId, disk: DISK_ID, snapshot: ID })
  }

  const openSnapshotRevertForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: (
          <Translate word={T.RevertSomething} values={`#${ID} - ${NAME}`} />
        ),
        children: <p>{T.DoYouWantProceed}</p>,
      },
      onSubmit: handleRevert,
    })

  return (
    <SubmitButton
      data-cy={`${VM_ACTIONS.SNAPSHOT_DISK_REVERT}-${DISK_ID}-${ID}`}
      iconOnly={<UndoAction />}
      tooltip={T.Revert}
      onClick={openSnapshotRevertForm}
    />
  )
})

const SnapshotDeleteAction = memo(({ vmId, disk, snapshot, sx }) => {
  const { showModal } = useModalsApi()
  const [deleteDiskSnapshot] = VmAPI.useDeleteDiskSnapshotMutation()
  const { DISK_ID } = disk
  const { ID, NAME = T.Snapshot } = snapshot

  const handleDelete = async () => {
    await deleteDiskSnapshot({ id: vmId, disk: DISK_ID, snapshot: ID })
  }

  const openSnapshotDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: (
          <Translate word={T.DeleteSomething} values={`#${ID} - ${NAME}`} />
        ),
        children: <p>{T.DoYouWantProceed}</p>,
      },
      onSubmit: handleDelete,
    })

  return (
    <SubmitButton
      data-cy={`${VM_ACTIONS.SNAPSHOT_DISK_DELETE}-${DISK_ID}-${ID}`}
      iconOnly={<Trash />}
      tooltip={T.Delete}
      onClick={openSnapshotDeleteForm}
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
