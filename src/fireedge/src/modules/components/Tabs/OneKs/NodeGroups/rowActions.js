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
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { OneKsAPI, useGeneralApi } from '@FeaturesModule'
import {
  ScalingOneksNodeGroupsForm,
  EditOneKsNodeGroupForm,
} from '@modules/components/Forms/OneKs'
import { generatePath, useHistory } from 'react-router-dom'
import { Tr } from '@modules/components/HOC'
import { T, ONEKS_OPERATIONS } from '@ConstantsModule'
import { PATH } from '@modules/components'

const RowAction = memo(({ node, id }) => {
  const history = useHistory()
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

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `edit-${nodeId}`,
          icon: <Edit />,
          tooltip: Tr(T.EditNodeGroup),
        }}
        options={[
          {
            dialogProps: {
              title: T.EditNodeGroup,
              dataCy: 'modal-edit-node',
            },
            form: () =>
              EditOneKsNodeGroupForm({
                initialValues: {
                  name: node?.name,
                  description: node?.description,
                },
              }),
            onSubmit: handleEdit,
          },
        ]}
      />
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `scaling-${nodeId}`,
          icon: <Upload />,
          tooltip: Tr(T.ResizeNodeGroup),
        }}
        options={[
          {
            dialogProps: {
              title: T.ResizeNodeGroup,
              dataCy: 'modal-scaling-node',
            },
            form: () => ScalingOneksNodeGroupsForm(),
            onSubmit: handleScaling,
          },
        ]}
      />
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `recover-${nodeId}`,
          icon: <RefreshCircular />,
          tooltip: Tr(T.RecoverNodeGroup),
        }}
        options={[
          {
            isConfirmDialog: true,
            dialogProps: {
              title: T.RecoverNodeGroup,
              dataCy: 'modal-recover-node',
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
            },
            onSubmit: handleRecover,
          },
        ]}
      />
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `delete-${nodeId}`,
          icon: <Trash />,
          tooltip: Tr(T.DeleteNodeGroup),
        }}
        options={[
          {
            isConfirmDialog: true,
            dialogProps: {
              title: T.DeleteNodeGroup,
              dataCy: 'modal-delete-node',
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
            },
            onSubmit: handleRemove,
          },
        ]}
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
