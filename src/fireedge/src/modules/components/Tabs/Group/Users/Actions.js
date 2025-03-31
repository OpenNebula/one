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

import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'

import { EditAdminsForm, EditUsersForm } from '@modules/components/Forms/Group'

import { T, STYLE_BUTTONS } from '@ConstantsModule'

/**
 * Action to edit administrators of a group
 */
const EditAdminsActions = memo(({ admins, filterData, submit }) => {
  // Handle submit form
  const handleEditAdmins = (formData) => {
    submit(formData.adminsToAdd, formData.adminsToRemove)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'edit-admins',
        label: T['groups.actions.edit.admins'],
        importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.OUTLINED,
      }}
      options={[
        {
          cy: 'edit-admins',
          name: T['groups.actions.edit.admins'],
          dialogProps: {
            title: T['groups.actions.edit.admins'],
            dataCy: 'modal-edit-admins',
          },
          form: () =>
            EditAdminsForm({
              initialValues: admins,
              stepProps: {
                filterData,
              },
            }),
          onSubmit: handleEditAdmins,
        },
      ]}
    />
  )
})

const AddUsersAction = memo(({ users, filterData, submit }) => {
  // Handle submit form
  const handleEditAdmins = (formData) => {
    submit(formData.users)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'add-user',
        label: T['groups.actions.add.user'],
        importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.FILLED,
      }}
      options={[
        {
          cy: 'add-user',
          name: T['groups.actions.add.user'],
          dialogProps: {
            title: T['groups.actions.add.user'],
            dataCy: 'modal-add-user',
          },
          form: () =>
            EditUsersForm({
              initialValues: users,
              stepProps: {
                filterData,
              },
            }),
          onSubmit: handleEditAdmins,
        },
      ]}
    />
  )
})

const RemoveUsersAction = memo(({ users, filterData, submit }) => {
  // Handle submit form
  const handleEditAdmins = (formData) => {
    submit(formData.users)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'remove-user',
        label: T['groups.actions.remove.user'],
        importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.OUTLINED,
      }}
      options={[
        {
          cy: 'remove-user',
          name: T['groups.actions.remove.user'],
          dialogProps: {
            title: T['groups.actions.remove.user'],
            dataCy: 'modal-remove-user',
          },
          form: () =>
            EditUsersForm({
              initialValues: users,
              stepProps: {
                filterData,
              },
            }),
          onSubmit: handleEditAdmins,
        },
      ]}
    />
  )
})

EditAdminsActions.propTypes = {
  admins: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
EditAdminsActions.displayName = 'EditAdminsActions'

AddUsersAction.propTypes = {
  users: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
AddUsersAction.displayName = 'AddUsersAction'

RemoveUsersAction.propTypes = {
  users: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
RemoveUsersAction.displayName = 'RemoveUsersAction'

export { AddUsersAction, EditAdminsActions, RemoveUsersAction }
