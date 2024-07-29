/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'

import { EditAdminsForm } from 'client/components/Forms/Group'

import { T } from 'client/constants'

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
        color: 'secondary',
        'data-cy': 'edit-admins',
        label: T['groups.actions.edit.admins'],
        variant: 'outlined',
        sx: {
          m: '1em',
        },
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

EditAdminsActions.propTypes = {
  admins: PropTypes.array,
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
EditAdminsActions.displayName = 'EditAdminsActions'

export { EditAdminsActions }
