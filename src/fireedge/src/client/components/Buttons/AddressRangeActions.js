/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import AddIcon from 'iconoir-react/dist/Plus'
import EditIcon from 'iconoir-react/dist/Edit'
import TrashIcon from 'iconoir-react/dist/Trash'

import {
  useAddRangeToVNetMutation,
  useUpdateVNetRangeMutation,
  useRemoveRangeFromVNetMutation,
} from 'client/features/OneApi/network'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { AddRangeForm } from 'client/components/Forms/VNetwork'

import { jsonToXml } from 'client/models/Helper'
import { Tr, Translate } from 'client/components/HOC'
import { T, VN_ACTIONS } from 'client/constants'

const AddAddressRangeAction = memo(({ vnetId, onSubmit }) => {
  const [addAR] = useAddRangeToVNetMutation()

  const handleAdd = async (formData) => {
    if (onSubmit && typeof onSubmit === 'function') {
      return await onSubmit(formData)
    }

    const template = jsonToXml({ AR: formData })
    await addAR({ id: vnetId, template }).unwrap()
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        color: 'secondary',
        'data-cy': 'add-ar',
        startIcon: <AddIcon />,
        label: T.AddressRange,
        variant: 'outlined',
      }}
      options={[
        {
          dialogProps: {
            title: T.AddressRange,
            dataCy: 'modal-add-ar',
          },
          form: AddRangeForm,
          onSubmit: handleAdd,
        },
      ]}
    />
  )
})

const UpdateAddressRangeAction = memo(({ vnetId, ar, onSubmit }) => {
  const [updateAR] = useUpdateVNetRangeMutation()
  const { AR_ID } = ar

  const handleUpdate = async (formData) => {
    if (onSubmit && typeof onSubmit === 'function') {
      return await onSubmit(formData)
    }

    const template = jsonToXml({ AR: formData })
    await updateAR({ id: vnetId, template })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VN_ACTIONS.UPDATE_AR}-${AR_ID}`,
        icon: <EditIcon />,
        tooltip: T.Edit,
      }}
      options={[
        {
          dialogProps: {
            title: `${Tr(T.AddressRange)}: #${AR_ID}`,
            dataCy: 'modal-update-ar',
          },
          form: () =>
            AddRangeForm({
              initialValues: ar,
              stepProps: { isUpdate: !onSubmit && AR_ID !== undefined },
            }),
          onSubmit: handleUpdate,
        },
      ]}
    />
  )
})

const DeleteAddressRangeAction = memo(({ vnetId, ar, onSubmit }) => {
  const [removeAR] = useRemoveRangeFromVNetMutation()
  const { AR_ID } = ar

  const handleRemove = async () => {
    if (onSubmit && typeof onSubmit === 'function') {
      return await onSubmit(AR_ID)
    }

    await removeAR({ id: vnetId, address: AR_ID })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VN_ACTIONS.DELETE_AR}-${AR_ID}`,
        icon: <TrashIcon />,
        tooltip: T.Delete,
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <>
                <Translate word={T.DeleteAddressRange} />
                {`: #${AR_ID}`}
              </>
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit: handleRemove,
        },
      ]}
    />
  )
})

const ActionPropTypes = {
  vnetId: PropTypes.string,
  ar: PropTypes.object,
  onSubmit: PropTypes.func,
}

AddAddressRangeAction.propTypes = ActionPropTypes
AddAddressRangeAction.displayName = 'AddAddressRangeActionButton'
UpdateAddressRangeAction.propTypes = ActionPropTypes
UpdateAddressRangeAction.displayName = 'UpdateAddressRangeActionButton'
DeleteAddressRangeAction.propTypes = ActionPropTypes
DeleteAddressRangeAction.displayName = 'DeleteAddressRangeAction'

export {
  AddAddressRangeAction,
  UpdateAddressRangeAction,
  DeleteAddressRangeAction,
}
