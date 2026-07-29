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
import { T } from '@ConstantsModule'
import {
  EditAdminsForm,
  EditUsersForm,
} from '@modules/resources/resources/Group/Forms'
import { useModalsApi } from '@FeaturesModule'
import { SubmitButton } from '@ComponentsV2Module'

const getUserId = (user) => (typeof user === 'object' ? user?.ID : user)

const normalizeUserIds = (users) =>
  []
    .concat(users ?? [])
    .map(getUserId)
    .filter((id) => id !== undefined && id !== null && id !== '')

const userDialogSizeProps = {
  dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogMaxHeight: 'calc(100vh - 64px)',
  dialogPaperOverflow: 'visible',
  dialogContentMaxHeight: '50vh',
  dialogContentOverflowY: 'auto',
}

const EditAdminsAction = memo(({ admins = [], filterData, submit }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(formData.adminsToAdd, formData.adminsToRemove)
  }

  const handleOpenForm = () =>
    showModal({
      id: 'edit-group-admins',
      cy: 'edit-group-admins',
      name: T['groups.actions.edit.admins'],

      dialogProps: {
        title: T['groups.actions.edit.admins'],
        dataCy: 'modal-edit-group-admins',
        validateOn: 'onSubmit',
        ...userDialogSizeProps,
      },

      onSubmit: handleSubmit,

      form: EditAdminsForm({
        initialValues: normalizeUserIds(admins),
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'edit-group-admins'}
      label={T['groups.actions.edit.admins']}
      type="secondary"
      onClick={handleOpenForm}
    />
  )
})

const AddUsersAction = memo(({ filterData, submit }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(normalizeUserIds(formData?.users ?? formData))
  }

  const handleOpenForm = () =>
    showModal({
      id: 'add-group-users',
      cy: 'add-group-users',
      name: T['groups.actions.add.user'],

      dialogProps: {
        title: T['groups.actions.add.user'],
        dataCy: 'modal-add-group-users',
        validateOn: 'onSubmit',
        ...userDialogSizeProps,
      },

      onSubmit: handleSubmit,

      form: EditUsersForm({
        initialValues: [],
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'add-group-users'}
      label={T['groups.actions.add.user']}
      type="secondary"
      onClick={handleOpenForm}
    />
  )
})

const RemoveUsersAction = memo(({ filterData, submit }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(normalizeUserIds(formData?.users ?? formData))
  }

  const handleOpenForm = () =>
    showModal({
      id: 'remove-group-users',
      cy: 'remove-group-users',
      name: T['groups.actions.remove.user'],

      dialogProps: {
        title: T['groups.actions.remove.user'],
        dataCy: 'modal-remove-group-users',
        validateOn: 'onSubmit',
        ...userDialogSizeProps,
      },

      onSubmit: handleSubmit,

      form: EditUsersForm({
        initialValues: [],
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'remove-group-users'}
      label={T['groups.actions.remove.user']}
      type="secondary"
      isDestructive
      onClick={handleOpenForm}
    />
  )
})

EditAdminsAction.propTypes = {
  admins: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
EditAdminsAction.displayName = 'EditAdminsAction'

AddUsersAction.propTypes = {
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
AddUsersAction.displayName = 'AddUsersAction'

RemoveUsersAction.propTypes = {
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
RemoveUsersAction.displayName = 'RemoveUsersAction'

export { AddUsersAction, EditAdminsAction, RemoveUsersAction }
