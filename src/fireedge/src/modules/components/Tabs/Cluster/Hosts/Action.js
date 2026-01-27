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

import { STYLE_BUTTONS, T } from '@ConstantsModule'
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { AddHostForm, DeleteHostForm } from '@modules/components/Forms/Cluster'

const AddHost = memo(({ formType, submit, filter }) => {
  // Handle submit form
  const handleSubmit = (formData) => {
    submit(formData.hosts)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'add-host',
        label: T.AddHostProvision,
        importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.FILLED,
      }}
      options={[
        {
          cy: 'add-host-to-group',
          name: T.AddHostProvision,
          dialogProps: {
            title: T.AddHostProvision,
            dataCy: 'modal-add-to-provision-host',
            validateOn: 'onSubmit',
          },
          form: () => {
            const params = {
              stepProps: {
                formType,
              },
            }
            formType !== 'amount' &&
              filter &&
              (params.stepProps.filter = filter)

            return AddHostForm(params)
          },
          onSubmit: handleSubmit,
        },
      ]}
    />
  )
})

const DeleteHost = memo(({ formType, submit, filter }) => {
  const handleSubmit = (formData) => {
    submit(formData.hosts)
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': 'delete-host',
        label: T.DeleteHostProvision,
        importance: STYLE_BUTTONS.IMPORTANCE.DANGER,
        size: STYLE_BUTTONS.SIZE.MEDIUM,
        type: STYLE_BUTTONS.TYPE.OUTLINED,
      }}
      options={[
        {
          cy: 'remove-host-from-group',
          name: T.DeleteHostProvision,
          dialogProps: {
            title: T.DeleteHostProvision,
            dataCy: 'modal-remove-from-provision-host',
            validateOn: 'onSubmit',
          },
          form: () => {
            const params = {
              stepProps: {
                formType,
              },
            }
            formType !== 'amount' &&
              filter &&
              (params.stepProps.filter = filter)

            return DeleteHostForm(params)
          },
          onSubmit: handleSubmit,
        },
      ]}
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
