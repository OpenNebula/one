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
import { EditGroupForm } from '@modules/resources/resources/User/Forms'

import { useModalsApi } from '@FeaturesModule'
import { SubmitButton } from '@ComponentsV2Module'

const getGroupId = (group) => (typeof group === 'object' ? group?.ID : group)

const normalizeGroupIds = (groups) =>
  []
    .concat(groups ?? [])
    .map(getGroupId)
    .filter((id) => id !== undefined && id !== null && id !== '')

const groupDialogSizeProps = {
  dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogMaxHeight: 'calc(100vh - 64px)',
  dialogPaperOverflow: 'visible',
  dialogContentMaxHeight: '50vh',
  dialogContentOverflowY: 'auto',
}

const AddToGroup = memo(({ filterData, submit }) => {
  const { showModal } = useModalsApi()

  // Handle submit form
  const handleSubmit = (formData) => {
    submit(normalizeGroupIds(formData?.groups ?? formData))
  }

  const handleOpenForm = () =>
    showModal({
      id: 'add-to-group',
      cy: 'add-to-group',
      name: T['users.actions.add.to.group'],

      dialogProps: {
        title: T['users.actions.add.to.group'],
        dataCy: 'modal-add-to-group',
        validateOn: 'onSubmit',
        ...groupDialogSizeProps,
      },

      onSubmit: handleSubmit,

      form: EditGroupForm({
        initialValues: [],
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'add-to-group'}
      label={T['users.actions.add.to.group']}
      type="secondary"
      onClick={handleOpenForm}
    />
  )
})

const RemoveFromGroup = memo(({ filterData, submit }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(normalizeGroupIds(formData?.groups ?? formData))
  }

  const handleOpenForm = () =>
    showModal({
      id: 'remove-from-group',
      cy: 'remove-from-group',
      name: T['users.actions.remove.from.group'],

      dialogProps: {
        title: T['users.actions.remove.from.group'],
        dataCy: 'modal-remove-from-group',
        validateOn: 'onSubmit',
        ...groupDialogSizeProps,
      },

      onSubmit: handleSubmit,

      form: EditGroupForm({
        initialValues: [],
        stepProps: {
          filterData,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'remove-from-group'}
      label={T['users.actions.remove.from.group']}
      type="secondary"
      isDestructive
      onClick={handleOpenForm}
    />
  )
})

const ChangePrimaryGroup = memo(({ filterData, submit }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(normalizeGroupIds(formData?.groups ?? formData)[0])
  }

  const handleOpenForm = () =>
    showModal({
      id: 'change-primary-group',
      cy: 'change-primary-group',
      name: T['users.actions.change.primary.group'],

      dialogProps: {
        title: T['users.actions.change.primary.group'],
        dataCy: 'modal-change-primary-group',
        validateOn: 'onSubmit',
        ...groupDialogSizeProps,
      },

      onSubmit: handleSubmit,

      form: EditGroupForm({
        stepProps: {
          filterData,
          singleSelect: true,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={'change-primary-group'}
      label={T['users.actions.change.primary.group']}
      type="secondary"
      onClick={handleOpenForm}
    />
  )
})

AddToGroup.propTypes = {
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
AddToGroup.displayName = 'AddToGroupAction'

RemoveFromGroup.propTypes = {
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
RemoveFromGroup.displayName = 'RemoveFromGroupAction'

ChangePrimaryGroup.propTypes = {
  filterData: PropTypes.func,
  submit: PropTypes.func,
}
ChangePrimaryGroup.displayName = 'ChangePrimaryGroupAction'

export { AddToGroup, ChangePrimaryGroup, RemoveFromGroup }
