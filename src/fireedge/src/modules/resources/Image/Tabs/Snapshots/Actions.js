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

import { IMAGE_ACTIONS, T } from '@ConstantsModule'
import { ImageAPI, useModalsApi } from '@FeaturesModule'
import { ResourceActionConfirmation, SubmitButton } from '@ComponentsV2Module'
import { Translate, useTranslation } from '@ProvidersModule'

const SnapshotFlattenAction = memo(({ id, snapshot, isDisabled = false }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()
  const [flattenImageSnapshot] = ImageAPI.useFlattenImageSnapshotMutation()
  const { ID, NAME = T.Snapshot } = snapshot

  const handleFlatten = async () => {
    await flattenImageSnapshot({ id, snapshot: ID })
  }

  const handleOpenForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: (
          <Translate word={T.FlattenSnapshot} values={`#${ID} - ${NAME}`} />
        ),
        description: (
          <ResourceActionConfirmation
            description={
              <>
                <p>{translate(T.DeleteOtherSnapshots)}</p>
                <p>{translate(T['resource.flatten.confirmation'])}</p>
              </>
            }
            resources={{ ID, NAME }}
            resourceType={T.Snapshot}
          />
        ),
        confirmLabel: T.Flatten,
      },
      onSubmit: handleFlatten,
    })

  return (
    <SubmitButton
      data-cy={IMAGE_ACTIONS.SNAPSHOT_FLATTEN}
      tooltip={translate(T.Flatten)}
      label={translate(T.Flatten)}
      onClick={handleOpenForm}
      isDisabled={isDisabled || id === undefined}
    />
  )
})

const SnapshotRevertAction = memo(({ id, snapshot, isDisabled = false }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()
  const [revertImageSnapshot] = ImageAPI.useRevertImageSnapshotMutation()
  const { ID, NAME = T.Snapshot } = snapshot

  const handleRevert = async () => {
    await revertImageSnapshot({ id, snapshot: ID })
  }

  const handleOpenForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: (
          <Translate word={T.RevertSomething} values={`#${ID} - ${NAME}`} />
        ),
        description: (
          <ResourceActionConfirmation
            description={T['resource.revert.confirmation']}
            resources={{ ID, NAME }}
            resourceType={T.Snapshot}
          />
        ),
        confirmLabel: T.Revert,
      },
      onSubmit: handleRevert,
    })

  return (
    <SubmitButton
      data-cy={IMAGE_ACTIONS.SNAPSHOT_REVERT}
      iconOnly={<UndoAction width="16px" height="16px" />}
      tooltip={translate(T.Revert)}
      onClick={handleOpenForm}
      isDisabled={isDisabled || id === undefined}
    />
  )
})

const SnapshotDeleteAction = memo(({ id, snapshot, isDisabled = false }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()
  const [deleteImageSnapshot] = ImageAPI.useDeleteImageSnapshotMutation()
  const { ID, NAME = T.Snapshot } = snapshot

  const handleDelete = async () => {
    await deleteImageSnapshot({ id, snapshot: ID })
  }

  const handleOpenForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: (
          <Translate word={T.DeleteSomething} values={`#${ID} - ${NAME}`} />
        ),
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID, NAME }}
            resourceType={T.Snapshot}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleDelete,
    })

  return (
    <SubmitButton
      data-cy={IMAGE_ACTIONS.SNAPSHOT_DELETE}
      iconOnly={<Trash width="16px" height="16px" />}
      tooltip={translate(T.Delete)}
      onClick={handleOpenForm}
      isDisabled={isDisabled || id === undefined}
    />
  )
})

const ActionPropTypes = {
  id: PropTypes.string,
  isDisabled: PropTypes.bool,
  snapshot: PropTypes.object,
}

SnapshotFlattenAction.propTypes = ActionPropTypes
SnapshotFlattenAction.displayName = 'SnapshotFlattenAction'

SnapshotRevertAction.propTypes = ActionPropTypes
SnapshotRevertAction.displayName = 'SnapshotRevertAction'

SnapshotDeleteAction.propTypes = ActionPropTypes
SnapshotDeleteAction.displayName = 'SnapshotDeleteAction'

export { SnapshotFlattenAction, SnapshotDeleteAction, SnapshotRevertAction }
