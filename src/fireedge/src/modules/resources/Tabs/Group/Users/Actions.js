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
import {
  EditAdminsForm,
  EditUsersForm,
} from '@modules/resources/resources/Group/Forms'
import { T } from '@ConstantsModule'
import { useModalsApi } from '@FeaturesModule'
import { SubmitButton } from '@ComponentsV2Module'

/**
 * Action to edit administrators of a group
 */
const EditAdminsActions = memo(({ admins, filterData, submit }) => {
  const { showModal } = useModalsApi()

  // Handle submit form
  const handleEditAdmins = (formData) => {
    submit(formData.adminsToAdd, formData.adminsToRemove)
  }

  const handleOpenForm = () =>
    showModal({
      cy: 'edit-admins',
      name: T['groups.actions.edit.admins'],

      dialogProps: {
        title: T['groups.actions.edit.admins'],
        dataCy: 'modal-edit-admins',
      },

      onSubmit: handleEditAdmins,

      form: EditAdminsForm({
        initialValues: admins,
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'edit-admins'}
      label={T['groups.actions.edit.admins']}
      onClick={handleOpenForm}
    />
  )
})

const AddUsersAction = memo(({ users, filterData, submit }) => {
  const { showModal } = useModalsApi()

  // Handle submit form
  const handleEditAdmins = (formData) => {
    submit(formData.users)
  }

  const handleOpenForm = () =>
    showModal({
      cy: 'add-user',
      name: T['groups.actions.add.user'],

      dialogProps: {
        title: T['groups.actions.add.user'],
        dataCy: 'modal-add-user',
      },

      onSubmit: handleEditAdmins,

      form: EditUsersForm({
        initialValues: users,
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'add-user'}
      label={T['groups.actions.add.user']}
      onClick={handleOpenForm}
    />
  )
})

const RemoveUsersAction = memo(({ users, filterData, submit }) => {
  const { showModal } = useModalsApi()

  // Handle submit form
  const handleEditAdmins = (formData) => {
    submit(formData.users)
  }

  const handleOpenForm = () =>
    showModal({
      cy: 'remove-user',
      name: T['groups.actions.remove.user'],

      dialogProps: {
        title: T['groups.actions.remove.user'],
        dataCy: 'modal-remove-user',
      },

      onSubmit: handleEditAdmins,

      form: EditUsersForm({
        initialValues: users,
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'remove-user'}
      label={T['groups.actions.remove.user']}
      onClick={handleOpenForm}
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
