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
import { memo, useMemo } from 'react'
import { Plus } from 'iconoir-react'
import { T, ONEKS_OPERATIONS, PATH } from '@ConstantsModule'
import * as OneKsForms from '@modules/resources/resources/OneKs/Forms'
import { OneKsAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import { createFieldsFromOneKsOdsUserInputs } from '@UtilsModule'
import { generatePath, useHistory } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Button } from '@ComponentsV2Module'

/**
 * Returns the handler that opens the Create Node Group form.
 *
 * @param {string} id - Cluster id
 * @param {object[]} families - Node Group families
 * @returns {Function} Create action handler
 */
export const useAddNodeGroupAction = (id, families = []) => {
  const history = useHistory()
  const { showModal } = useModalsApi()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createOneKsNodeGroup] = OneKsAPI.useCreateOneKsNodeGroupMutation()

  const familiesUserInputs = useMemo(
    () => createFieldsFromOneKsOdsUserInputs(families),
    [families]
  )

  /**
   * Creates a Node Group.
   *
   * @param {object} template - Node Group template
   * @returns {Promise<void>} Creation result
   */
  const handleCreateNodeGroup = async (template) => {
    try {
      await createOneKsNodeGroup({ id, template }).unwrap()
      history.push(generatePath(PATH.ONEKS.CREATE_CLOUD_LOGS, { id }), {
        operation: ONEKS_OPERATIONS.ADD_NODEGROUP.name,
      })
      enqueueSuccess(T.SuccessNodeGroupCreated)
    } catch (error) {
      enqueueError(T.ErrorNodeGroupCreation, error?.message)
    }
  }

  /**
   * Opens the Create Node Group form.
   *
   * @returns {void}
   */
  const handleOpenForm = () =>
    showModal({
      isFormDialog: true,
      dialogProps: {
        title: T.Create,
        dataCy: 'modal-create-node-group',
        steps: OneKsForms.CreateOneKsNodeGroupForm,
        stepProps: {
          families: familiesUserInputs,
        },
      },
      onSubmit: handleCreateNodeGroup,
    })

  return handleOpenForm
}

const AddNodeGroupAction = memo(({ disabled = false, onClick }) => (
  <Button
    data-cy={`add-node-group`}
    startIcon={<Plus />}
    title={T.Create}
    type={'secondary'}
    isDisabled={disabled}
    onClick={onClick}
  />
))
AddNodeGroupAction.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
}
AddNodeGroupAction.displayName = 'AddNodeGroupAction'

export { AddNodeGroupAction }
