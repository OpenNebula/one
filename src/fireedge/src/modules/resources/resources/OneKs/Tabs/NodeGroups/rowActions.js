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

import PropTypes from 'prop-types'
import { memo } from 'react'
import { generatePath, useHistory } from 'react-router-dom'
import { EditPencil, Expand, RefreshCircular, Trash } from 'iconoir-react'
import { Button, ResourceActionConfirmation } from '@ComponentsV2Module'
import { T, ONEKS_OPERATIONS, PATH } from '@ConstantsModule'
import { OneKsAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import {
  EditOneKsNodeGroupForm,
  ScaleKsGroupForm,
} from '@modules/resources/resources/OneKs/Forms'
import { DIALOG_SIZE_PROPS } from '@modules/resources/resources/OneKs/Tabs/NodeGroups/styles'

/**
 * Renders the actions for a selected Node Group.
 *
 * @param {object} root0 - Params
 * @param {object} root0.node - Node Group data
 * @param {string|number} root0.id - Cluster ID
 * @returns {object} Node Group actions
 */
const NodeGroupActions = memo(({ node, id }) => {
  const history = useHistory()
  const { showModal } = useModalsApi()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [deleteNodeGroup] = OneKsAPI.useDeleteNodeGroupMutation()
  const [scaleNodeGroup] = OneKsAPI.useScaleOneKsClusterNodeGroupsMutation()
  const [recoverNodeGroup] = OneKsAPI.useRecoverOneKsNodeGroupMutation()
  const [updateNodeGroup] = OneKsAPI.useUpdateOneKsClusterNodeGroupsMutation()
  const nodeId = node?.id
  const isDisabled = nodeId === undefined || nodeId === null

  const handleRemove = async () => {
    try {
      await deleteNodeGroup({ id, nodegroup_id: nodeId }).unwrap()
      enqueueSuccess(T.SuccessNodeGroupDeleted)
    } catch {
      enqueueError(T.ErrorNodeGroupDeletion)
    }
  }

  const handleScaling = async (template) => {
    try {
      await scaleNodeGroup({ id, nodegroup_id: nodeId, template }).unwrap()
      history.push(generatePath(PATH.ONEKS.CREATE_CLOUD_LOGS, { id }), {
        operation: ONEKS_OPERATIONS.SCALING.name,
      })
      enqueueSuccess(T.SuccessNodeGroupScaled)
    } catch {
      enqueueError(T.ErrorNodeGroupScaling)
    }
  }

  const handleRecover = async () => {
    try {
      await recoverNodeGroup({ id, nodegroup_id: nodeId }).unwrap()
      history.push(generatePath(PATH.ONEKS.CREATE_CLOUD_LOGS, { id }), {
        operation: ONEKS_OPERATIONS.SCALING.name,
      })
      enqueueSuccess(T.SuccessNodeGroupRecovered)
    } catch {
      enqueueError(T.ErrorNodeGroupRecovery)
    }
  }

  const handleEdit = async (template) => {
    try {
      await updateNodeGroup({ id, nodegroup_id: nodeId, template }).unwrap()
      enqueueSuccess(T.SuccessUpdateNodeGroup)
    } catch {
      enqueueError(T.ErrorUpdateNodeGroup)
    }
  }

  const handleOpenEditForm = () =>
    showModal({
      dialogProps: {
        title: T.EditNodeGroup,
        dataCy: 'modal-edit-node',
        ...DIALOG_SIZE_PROPS,
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
        ...DIALOG_SIZE_PROPS,
      },
      form: ScaleKsGroupForm,
      onSubmit: handleScaling,
    })

  const handleOpenRecoverForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.RecoverNodeGroup,
        dataCy: 'modal-recover-node',
        description: (
          <ResourceActionConfirmation
            description={T['resource.recover.confirmation']}
            resources={{ ID: nodeId, NAME: node?.name }}
            resourceType={T.NodeGroups}
          />
        ),
        confirmLabel: T.Recover,
      },
      onSubmit: handleRecover,
    })

  const handleOpenRemoveForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.DeleteNodeGroup,
        dataCy: 'modal-delete-node',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{ ID: nodeId, NAME: node?.name }}
            resourceType={T.NodeGroups}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleRemove,
    })

  return (
    <>
      <Button
        data-cy={`edit-${nodeId}`}
        title={T.Edit}
        type="secondary"
        size="small"
        startIcon={<EditPencil width="16px" height="16px" />}
        isDisabled={isDisabled}
        onClick={handleOpenEditForm}
      />
      <Button
        data-cy={`scaling-${nodeId}`}
        title={T.Scale}
        type="secondary"
        size="small"
        startIcon={<Expand width="16px" height="16px" />}
        isDisabled={isDisabled}
        onClick={handleOpenScalingForm}
      />
      <Button
        data-cy={`recover-${nodeId}`}
        title={T.Recover}
        type="secondary"
        size="small"
        startIcon={<RefreshCircular width="16px" height="16px" />}
        isDisabled={isDisabled}
        onClick={handleOpenRecoverForm}
      />
      <Button
        data-cy={`delete-${nodeId}`}
        title={T.Delete}
        type="primary"
        size="small"
        startIcon={<Trash width="16px" height="16px" />}
        isDestructive
        isDisabled={isDisabled}
        onClick={handleOpenRemoveForm}
      />
    </>
  )
})

NodeGroupActions.propTypes = {
  node: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
}

NodeGroupActions.displayName = 'NodeGroupActions'

export default NodeGroupActions
