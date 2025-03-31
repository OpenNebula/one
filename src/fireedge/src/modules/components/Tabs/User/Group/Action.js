/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { T, STYLE_BUTTONS } from '@ConstantsModule'
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { EditGroupForm } from '@modules/components/Forms/User'

const AddToGroup = memo(({ groups, filterData, submit }) => {
  // Handle submit form
  const habdleSubmit = (formData) => {
    submit(formData.groups)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'add-to-group',
        label: T['users.actions.add.to.group'],
        importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.FILLED,
      }}
      options={[
        {
          cy: 'add-to-group',
          name: T['users.actions.add.to.group'],
          dialogProps: {
            title: T['users.actions.add.to.group'],
            dataCy: 'modal-add-to-group',
          },
          form: () =>
            EditGroupForm({
              initialValues: groups,
              stepProps: {
                filterData,
              },
            }),
          onSubmit: habdleSubmit,
        },
      ]}
    />
  )
})

const RemoveFromGroup = memo(({ groups, filterData, submit }) => {
  const handleSubmit = (formData) => {
    submit(formData.groups)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'remove-from-group',
        label: T['users.actions.remove.from.group'],
        importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.OUTLINED,
      }}
      options={[
        {
          cy: 'remove-from-group',
          name: T['users.actions.remove.from.group'],
          dialogProps: {
            title: T['users.actions.remove.from.group'],
            dataCy: 'modal-remove-from-group',
          },
          form: () =>
            EditGroupForm({
              initialValues: groups,
              stepProps: {
                filterData,
              },
            }),
          onSubmit: handleSubmit,
        },
      ]}
    />
  )
})

const ChangePrimaryGroup = memo(({ groups, filterData, submit }) => {
  const handleSubmit = (formData) => {
    submit(formData.groups)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'change-primary-group',
        label: T['users.actions.change.primary.group'],
        importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.OUTLINED,
      }}
      options={[
        {
          cy: 'change-primary-group',
          name: T['users.actions.change.primary.group'],
          dialogProps: {
            title: T['users.actions.change.primary.group'],
            dataCy: 'modal-change-primary-group',
          },
          form: () =>
            EditGroupForm({
              initialValues: groups,
              stepProps: {
                filterData,
                singleSelect: true,
              },
            }),
          onSubmit: handleSubmit,
        },
      ]}
    />
  )
})

AddToGroup.propTypes = {
  groups: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
AddToGroup.displayName = 'AddToGroupAction'

RemoveFromGroup.propTypes = {
  groups: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
RemoveFromGroup.displayName = 'RemoveFromGroupAction'

ChangePrimaryGroup.propTypes = {
  groups: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
ChangePrimaryGroup.displayName = 'ChangePrimaryGroupAction'

export { AddToGroup, ChangePrimaryGroup, RemoveFromGroup }
