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

import { SubmitButton } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { useModalsApi } from '@FeaturesModule'
import {
  AddHostForm,
  DeleteHostForm,
} from '@modules/resources/resources/Cluster/Forms'

const deleteHostDialogSizeProps = {
  dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1120px' },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogMaxHeight: 'calc(100vh - 64px)',
  dialogPaperOverflow: 'visible',
  dialogContentMaxHeight: '70vh',
  dialogContentOverflowY: 'auto',
}

const AddHost = memo(({ formType, submit, filter }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(formData.hosts)
  }

  const formConfig = {
    stepProps: {
      formType,
    },
  }
  formType !== 'amount' && filter && (formConfig.stepProps.filter = filter)

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T.AddHostProvision,
        dataCy: 'modal-add-to-provision-host',
      },
      onSubmit: handleSubmit,
      form: AddHostForm(formConfig),
    })

  return (
    <SubmitButton
      data-cy="add-host"
      type="secondary"
      onClick={handleOpenForm}
      label={T.AddHostProvision}
    />
  )
})

const DeleteHost = memo(({ formType, submit, filter }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(formData.hosts)
  }

  const formConfig = {
    stepProps: {
      formType,
    },
  }
  formType !== 'amount' && filter && (formConfig.stepProps.filter = filter)

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T.DeleteHostProvision,
        dataCy: 'modal-remove-from-provision-host',
        validateOn: 'onSubmit',
        ...deleteHostDialogSizeProps,
      },
      onSubmit: handleSubmit,
      form: DeleteHostForm(formConfig),
    })

  return (
    <SubmitButton
      data-cy="delete-host"
      type="secondary"
      onClick={handleOpenForm}
      isDestructive
      label={T.DeleteHostProvision}
    />
  )
})

AddHost.propTypes = {
  formType: PropTypes.string,
  filter: PropTypes.func,
  submit: PropTypes.func,
}

AddHost.displayName = 'AddHostAction'

DeleteHost.propTypes = {
  formType: PropTypes.string,
  filter: PropTypes.func,
  submit: PropTypes.func,
}

DeleteHost.displayName = 'DeleteHostAction'

export { AddHost, DeleteHost }
