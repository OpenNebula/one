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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Trash, UndoAction } from 'iconoir-react'
import { VmAPI, useModalsApi } from '@FeaturesModule'
import { CreateSnapshotForm } from '@modules/resources/resources/VirtualMachine/Forms'

import { Translate, useTranslation } from '@ProvidersModule'
import { T, VM_ACTIONS } from '@ConstantsModule'

import { SubmitButton } from '@ComponentsV2Module'

const CreateAction = memo(({ vmId }) => {
  const { showModal } = useModalsApi()

  const [createSnapshot] = VmAPI.useCreateVmSnapshotMutation()

  const handleCreate = async ({ name } = {}) => {
    await createSnapshot({ id: vmId, name })
  }

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T.TakeSnapshot,
        dataCy: 'modal-create-snapshot',
      },

      onSubmit: handleCreate,
      form: CreateSnapshotForm,
    })

  return (
    <SubmitButton
      data-cy={'snapshot-create'}
      label={T.TakeSnapshot}
      onClick={handleOpenForm}
    />
  )
})

const RevertAction = memo(({ vmId, snapshot }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()

  const [revertSnapshot] = VmAPI.useRevertVmSnapshotMutation()
  const { SNAPSHOT_ID, NAME } = snapshot

  const handleRevert = async () => {
    await revertSnapshot({ id: vmId, snapshot: SNAPSHOT_ID })
  }

  const handleOpenForm = () =>
    showModal({
      isConfirmDialog: true,

      dialogProps: {
        title: (
          <Translate
            word={T.RevertSomething}
            values={`#${SNAPSHOT_ID} - ${NAME}`}
          />
        ),
        dataCy: 'modal-revert-snapshot',
        children: <p>{translate(T.DoYouWantProceed)}</p>,
      },

      onSubmit: handleRevert,
    })

  return (
    <SubmitButton
      data-cy={`${VM_ACTIONS.SNAPSHOT_REVERT}-${SNAPSHOT_ID}`}
      iconOnly={<UndoAction />}
      tooltip={translate(T.Revert)}
      onClick={handleOpenForm}
    />
  )
})

const DeleteAction = memo(({ vmId, snapshot }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()

  const [deleteSnapshot] = VmAPI.useDeleteVmSnapshotMutation()
  const { SNAPSHOT_ID, NAME } = snapshot

  const handleDelete = async () => {
    await deleteSnapshot({ id: vmId, snapshot: SNAPSHOT_ID })
  }

  const handleOpenForm = () =>
    showModal({
      isConfirmDialog: true,

      dialogProps: {
        title: (
          <Translate
            word={T.DeleteSomething}
            values={`#${SNAPSHOT_ID} - ${NAME}`}
          />
        ),
        dataCy: 'modal-delete-snapshot',
        children: <p>{translate(T.DoYouWantProceed)}</p>,
      },

      onSubmit: handleDelete,
    })

  return (
    <SubmitButton
      data-cy={`${VM_ACTIONS.SNAPSHOT_DELETE}-${SNAPSHOT_ID}`}
      iconOnly={<Trash />}
      tooltip={translate(T.Delete)}
      onClick={handleOpenForm}
    />
  )
})

const ActionPropTypes = {
  vmId: PropTypes.string.isRequired,
  snapshot: PropTypes.object,
}

CreateAction.propTypes = ActionPropTypes
CreateAction.displayName = 'CreateActionButton'
RevertAction.propTypes = ActionPropTypes
RevertAction.displayName = 'RevertActionButton'
DeleteAction.propTypes = ActionPropTypes
DeleteAction.displayName = 'DeleteActionButton'

export { CreateAction, DeleteAction, RevertAction }
