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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Trash, UndoAction } from 'iconoir-react'
import {
  useCreateVmSnapshotMutation,
  useRevertVmSnapshotMutation,
  useDeleteVmSnapshotMutation,
} from 'client/features/OneApi/vm'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { CreateSnapshotForm } from 'client/components/Forms/Vm'

import { Tr, Translate } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const CreateAction = memo(({ vmId }) => {
  const [createSnapshot] = useCreateVmSnapshotMutation()

  const handleCreate = async ({ name } = {}) => {
    await createSnapshot({ id: vmId, name })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        color: 'secondary',
        'data-cy': 'snapshot-create',
        label: T.TakeSnapshot,
        variant: 'outlined',
      }}
      options={[
        {
          dialogProps: {
            title: T.TakeSnapshot,
            dataCy: 'modal-create-snapshot',
          },
          form: CreateSnapshotForm,
          onSubmit: handleCreate,
        },
      ]}
    />
  )
})

const RevertAction = memo(({ vmId, snapshot }) => {
  const [revertSnapshot] = useRevertVmSnapshotMutation()
  const { SNAPSHOT_ID, NAME } = snapshot

  const handleRevert = async () => {
    await revertSnapshot({ id: vmId, snapshot: SNAPSHOT_ID })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_REVERT}-${SNAPSHOT_ID}`,
        icon: <UndoAction />,
        tooltip: Tr(T.Revert),
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate
                word={T.RevertSomething}
                values={`#${SNAPSHOT_ID} - ${NAME}`}
              />
            ),
            dataCy: 'modal-revert-snapshot',
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit: handleRevert,
        },
      ]}
    />
  )
})

const DeleteAction = memo(({ vmId, snapshot }) => {
  const [deleteSnapshot] = useDeleteVmSnapshotMutation()
  const { SNAPSHOT_ID, NAME } = snapshot

  const handleDelete = async () => {
    await deleteSnapshot({ id: vmId, snapshot: SNAPSHOT_ID })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DELETE}-${SNAPSHOT_ID}`,
        icon: <Trash />,
        tooltip: Tr(T.Delete),
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate
                word={T.DeleteSomething}
                values={`#${SNAPSHOT_ID} - ${NAME}`}
              />
            ),
            dataCy: 'modal-delete-snapshot',
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
  snapshot: PropTypes.object,
}

CreateAction.propTypes = ActionPropTypes
CreateAction.displayName = 'CreateActionButton'
RevertAction.propTypes = ActionPropTypes
RevertAction.displayName = 'RevertActionButton'
DeleteAction.propTypes = ActionPropTypes
DeleteAction.displayName = 'DeleteActionButton'

export { CreateAction, DeleteAction, RevertAction }
