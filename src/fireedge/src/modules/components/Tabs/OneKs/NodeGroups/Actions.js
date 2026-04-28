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
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { Plus } from 'iconoir-react'
import { Tr } from '@modules/components/HOC'
import { T, STYLE_BUTTONS, ONEKS_OPERATIONS } from '@ConstantsModule'
import { CreateOneKsNodeGroupForm } from '@modules/components/Forms/OneKs'
import { OneKsAPI, useGeneralApi } from '@FeaturesModule'
import { createFieldsFromOneKsOdsUserInputs } from '@UtilsModule'
import { generatePath, useHistory } from 'react-router-dom'
import PropTypes from 'prop-types'
import { PATH } from '@modules/components'

/**
 * Generates the actions to operate resources on VM table.
 *
 * @param {object} props - datatable props
 * @param {string} props.id - Cluster id
 * @param {string} props.disable - Cluster id
 * @returns {object} - Actions
 */

const AddNodeGroupAction = memo(({ id, disable }) => {
  const history = useHistory()
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [createOneKsNodeGroup] = OneKsAPI.useCreateOneKsNodeGroupMutation()

  const { data: families } = OneKsAPI.useGetOneKsNodegroupFamiliesQuery()

  const familiesUserInputs = createFieldsFromOneKsOdsUserInputs(families)

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

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `add-node-group`,
        startIcon: <Plus />,
        disabled: !disable,
        label: T.AddNodeGroup,
        tooltip: Tr(T.Create),
        importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.FILLED,
      }}
      options={[
        {
          dialogProps: {
            title: Tr(T.Create),
            dataCy: 'modal-create-node-group',
            fixedHeight: true,
            fixedWidth: true,
          },
          form: () =>
            CreateOneKsNodeGroupForm({
              stepProps: {
                families: familiesUserInputs,
              },
            }),
          onSubmit: handleCreateNodeGroup,
        },
      ]}
    />
  )
})
AddNodeGroupAction.propTypes = {
  id: PropTypes.string,
  disable: PropTypes.bool,
}
AddNodeGroupAction.displayName = 'AddNodeGroupAction'

export { AddNodeGroupAction }
