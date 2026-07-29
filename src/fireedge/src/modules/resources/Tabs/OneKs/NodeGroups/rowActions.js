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

import { Upload, Trash, RefreshCircular, Edit } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'
import { OneKsAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import {
  ScalingOneksNodeGroupsForm,
  EditOneKsNodeGroupForm,
} from '@modules/resources/Forms/OneKs'
import { generatePath, useHistory } from 'react-router-dom'
import { useTranslation } from '@ProvidersModule'
import { T, ONEKS_OPERATIONS, PATH } from '@ConstantsModule'
import { SubmitButton } from '@ComponentsV2Module'

const RowAction = memo(({ node, id }) => {
  const { translate } = useTranslation()
  const history = useHistory()
  const { showModal } = useModalsApi()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [deleteNodeGroup] = OneKsAPI.useDeleteNodeGroupMutation()
  const [scaleNodeGroup] = OneKsAPI.useScaleOneKsClusterNodeGroupsMutation()
  const [recoverNodeGroup] = OneKsAPI.useRecoverOneKsNodeGroupMutation()
  const [updateNodeGroup] = OneKsAPI.useUpdateOneKsClusterNodeGroupsMutation()
  const nodeId = node?.id

  const handleRemove = async () => {
    try {
      await deleteNodeGroup({ id, nodegroup_id: nodeId })
      enqueueSuccess(T.SuccessNodeGroupDeleted)
    } catch (error) {
      enqueueError(T.ErrorNodeGroupDeletion)
    }
  }
  const handleScaling = async (template) => {
    try {
      await scaleNodeGroup({ id, nodegroup_id: nodeId, template })
      // Go to oneks logs
      history.push(generatePath(PATH.ONEKS.CREATE_CLOUD_LOGS, { id }), {
        operation: ONEKS_OPERATIONS.SCALING.name,
      })
      enqueueSuccess(T.SuccessNodeGroupScaled)
    } catch (error) {
      enqueueError(T.ErrorNodeGroupScaling)
    }
  }

  const handleRecover = async () => {
    try {
      await recoverNodeGroup({ id, nodegroup_id: nodeId })
      // Go to oneks logs
      history.push(generatePath(PATH.ONEKS.CREATE_CLOUD_LOGS, { id }), {
        operation: ONEKS_OPERATIONS.SCALING.name,
      })
      enqueueSuccess(T.SuccessNodeGroupRecovered)
    } catch (error) {
      enqueueError(T.ErrorNodeGroupRecovery)
    }
  }

  const handleEdit = async (template) => {
    try {
      await updateNodeGroup({ id, nodegroup_id: nodeId, template })
      enqueueSuccess(T.SuccessUpdateNodeGroup)
    } catch (error) {
      enqueueError(T.ErrorUpdateNodeGroup)
    }
  }

  const handleOpenEditForm = () =>
    showModal({
      dialogProps: {
        title: T.EditNodeGroup,
        dataCy: 'modal-edit-node',
      },
      form: EditOneKsNodeGroupForm({
        initialValues: {
          name: node?.name,
          description: node?.description,
        },
      }),
      onSubmit: handleEdit,
    })

  const handleOpenScalingForm = () =>
    showModal({
      dialogProps: {
        title: T.ResizeNodeGroup,
        dataCy: 'modal-scaling-node',
      },
      form: ScalingOneksNodeGroupsForm,
      onSubmit: handleScaling,
    })

  const handleOpenRecoverForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.RecoverNodeGroup,
        dataCy: 'modal-recover-node',
        children: (
          <>
            <p>{translate(T.DoYouWantProceed)}</p>
          </>
        ),
      },
      onSubmit: handleRecover,
    })

  const handleOpenRemoveForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.RecoverNodeGroup,
        dataCy: 'modal-delete-node',
        children: (
          <>
            <p>{translate(T.DoYouWantProceed)}</p>
          </>
        ),
      },
      onSubmit: handleRemove,
    })

  return (
    <>
      <SubmitButton
        data-cy={`edit-${nodeId}`}
        iconOnly={<Edit />}
        tooltip={translate(T.EditNodeGroup)}
        variant={'outlined'}
        onClick={handleOpenEditForm}
      />
      <SubmitButton
        data-cy={`scaling-${nodeId}`}
        iconOnly={<Upload />}
        tooltip={translate(T.ResizeNodeGroup)}
        variant={'outlined'}
        onClick={handleOpenScalingForm}
      />
      <SubmitButton
        data-cy={`recover-${nodeId}`}
        iconOnly={<RefreshCircular />}
        tooltip={translate(T.RecoverNodeGroup)}
        variant={'outlined'}
        onClick={handleOpenRecoverForm}
      />
      <SubmitButton
        data-cy={`delete-${nodeId}`}
        iconOnly={<Trash />}
        tooltip={translate(T.DeleteNodeGroup)}
        variant={'outlined'}
        onClick={handleOpenRemoveForm}
      />
    </>
  )
})

RowAction.propTypes = {
  node: PropTypes.object.isRequired,
  id: PropTypes.number.isRequired,
}

RowAction.displayName = 'RowAction'

export default RowAction
