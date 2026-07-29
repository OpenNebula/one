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
  AddVnetsForm,
  DeleteIpsForm,
} from '@modules/resources/resources/Cluster/Forms'

const AddIps = memo(({ formType, isDisabled, submit }) => {
  const { showModal } = useModalsApi()

  const handleSubmit = (formData) => {
    submit(formData.amount)
  }

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T.AddIpsProvision,
        dataCy: 'modal-add-to-provision-ips',
        validateOn: 'onSubmit',
      },
      onSubmit: handleSubmit,
      form: AddVnetsForm({
        stepProps: {
          formType,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy="add-vnets"
      type="secondary"
      onClick={handleOpenForm}
      isDisabled={isDisabled}
      label={T.AddIpsProvision}
    />
  )
})

const DeleteIps = memo(({ addressRanges = [], isDisabled, submit }) => {
  const { showModal } = useModalsApi()

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T['cluster.vnet.del.ip'],
        dataCy: 'modal-delete-provision-ip-range',
        validateOn: 'onSubmit',
      },
      onSubmit: submit,
      form: DeleteIpsForm({
        stepProps: {
          addressRanges,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy="del-ip"
      type="secondary"
      onClick={handleOpenForm}
      isDestructive
      isDisabled={isDisabled || addressRanges.length === 0}
      label={T['cluster.vnet.del.ip']}
    />
  )
})

AddIps.propTypes = {
  formType: PropTypes.string,
  isDisabled: PropTypes.bool,
  submit: PropTypes.func,
}

AddIps.displayName = 'AddIpsAction'

DeleteIps.propTypes = {
  addressRanges: PropTypes.array,
  isDisabled: PropTypes.bool,
  submit: PropTypes.func,
}

DeleteIps.displayName = 'DeleteIpsAction'

export { AddIps, DeleteIps }
