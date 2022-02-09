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
import { memo, useContext } from 'react'
import PropTypes from 'prop-types'

import {
  Trash,
  Edit,
  UndoAction,
  SaveActionFloppy,
  Camera,
  Expand,
} from 'iconoir-react'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import {
  SaveAsDiskForm,
  CreateDiskSnapshotForm,
  ResizeDiskForm,
} from 'client/components/Forms/Vm'

import { Tr, Translate } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const DetachAction = memo(({ disk, name: imageName }) => {
  const { DISK_ID } = disk
  const { detachDisk } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleDetach = async () => await detachDisk(vm.ID, DISK_ID)

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

const SaveAsAction = memo(({ disk, snapshot, name: imageName }) => {
  const { DISK_ID: diskId } = disk
  const { ID: snapshotId, NAME: snapshotName } = snapshot ?? {}

  const { saveAsDisk } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const handleSaveAs = async ({ NAME } = {}) => {
    const data = { disk: diskId, name: NAME, snapshot: snapshotId }
    const response = await saveAsDisk(vm.ID, data)

    String(response) === String(vm.ID) && (await handleRefetch?.(vm.ID))
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

const SnapshotRenameAction = memo(({ disk, snapshot }) => {
  const { DISK_ID } = disk
  const { ID, NAME = '' } = snapshot
  const { renameDiskSnapshot } = useVmApi()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const handleRename = async ({ NAME: newName } = {}) => {
    const data = { disk: DISK_ID, snapshot: ID, name: newName }
    const response = await renameDiskSnapshot(vm.ID, data)

    String(response) === String(vm.ID) && (await handleRefetch?.(vm.ID))
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
  disk: PropTypes.object,
  snapshot: PropTypes.object,
  name: PropTypes.string,
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
  SnapshotRevertAction,
}
