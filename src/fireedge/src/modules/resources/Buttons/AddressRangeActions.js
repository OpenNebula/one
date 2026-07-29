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
import {
  Edit as EditIcon,
  Plus as AddIcon,
  Trash as TrashIcon,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'

import { AddRangeForm } from '@modules/resources/Forms/VNetwork'
import { VnAPI, useModalsApi } from '@FeaturesModule'

import { jsonToXml, hasRestrictedAttributes } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { RESTRICTED_ATTRIBUTES_TYPE, T, VN_ACTIONS } from '@ConstantsModule'

import { SubmitButton } from '@ComponentsV2Module'

const AddAddressRangeAction = memo(
  ({ vnetId, onSubmit, oneConfig, adminGroup }) => {
    const { showModal } = useModalsApi()

    const [addAR] = VnAPI.useAddRangeToVNetMutation()

    const handleAdd = async (formData) => {
      if (onSubmit && typeof onSubmit === 'function') {
        return await onSubmit(formData)
      }

      const template = jsonToXml({ AR: formData })
      await addAR({ id: vnetId, template }).unwrap()
    }

    const formConfig = {
      stepProps: {
        vnetId,
        oneConfig,
        adminGroup,
        restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.VNET,
        nameParentAttribute: 'AR',
      },
    }

    const handleOpenForm = () =>
      showModal({
        dialogProps: {
          title: T.AddressRange,
          dataCy: 'modal-add-ar',
        },

        onSubmit: handleAdd,
        form: AddRangeForm(formConfig),
      })

    return (
      <SubmitButton
        data-cy={'add-ar'}
        startIcon={<AddIcon />}
        label={T.AddressRange}
        onClick={handleOpenForm}
      />
    )
  }
)

const UpdateAddressRangeAction = memo(
  ({ vnetId, ar, onSubmit, oneConfig, adminGroup }) => {
    const { translate } = useTranslation()
    const { showModal } = useModalsApi()

    const [updateAR] = VnAPI.useUpdateVNetRangeMutation()
    const { AR_ID } = ar

    const handleUpdate = async (formData) => {
      if (onSubmit && typeof onSubmit === 'function') {
        return await onSubmit(formData)
      }

      const template = jsonToXml({ AR: formData })
      await updateAR({ id: vnetId, template })
    }

    const handleOpenForm = () =>
      showModal({
        dialogProps: {
          title: AR_ID
            ? `${translate(T.AddressRange)}: #${AR_ID}`
            : `${translate(T.AddressRange)}`,
          dataCy: 'modal-update-ar',
        },

        onSubmit: handleUpdate,

        form: AddRangeForm({
          initialValues: ar,
          stepProps: {
            isUpdate: !onSubmit && AR_ID !== undefined,
            oneConfig,
            adminGroup,
            restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.VNET,
            nameParentAttribute: 'AR',
          },
        }),
      })

    return (
      <SubmitButton
        data-cy={`${VN_ACTIONS.UPDATE_AR}-${AR_ID}`}
        iconOnly={<EditIcon />}
        tooltip={T.Edit}
        onClick={handleOpenForm}
      />
    )
  }
)

const DeleteAddressRangeAction = memo(
  ({ vnetId, ar, onSubmit, oneConfig, adminGroup, submit }) => {
    const { translate } = useTranslation()
    const { showModal } = useModalsApi()

    const [removeAR] = VnAPI.useRemoveRangeFromVNetMutation()
    const { AR_ID } = ar

    const handleRemove = async () => {
      if (onSubmit && typeof onSubmit === 'function') {
        return await onSubmit(AR_ID)
      }

      // When deleting AR in a provision, use the oneform API
      submit
        ? await submit({ arId: AR_ID })
        : await removeAR({ id: vnetId, address: AR_ID })
    }

    // Disable action if the disk has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      hasRestrictedAttributes(ar, 'AR', oneConfig?.VNET_RESTRICTED_ATTR)

    const handleOpenForm = () =>
      showModal({
        isConfirmDialog: true,

        dialogProps: {
          title: AR_ID
            ? `${translate(T.DeleteAddressRange)}: #${AR_ID}`
            : `${translate(T.DeleteAddressRange)}`,
          children: <p>{translate(T.DoYouWantProceed)}</p>,
        },

        onSubmit: handleRemove,
      })

    return (
      <SubmitButton
        data-cy={`${VN_ACTIONS.DELETE_AR}-${AR_ID}`}
        iconOnly={<TrashIcon />}
        tooltip={
          !disabledAction ? translate(T.Detach) : translate(T.DetachRestricted)
        }
        disabled={disabledAction}
        onClick={handleOpenForm}
      />
    )
  }
)

const ActionPropTypes = {
  vnetId: PropTypes.string,
  ar: PropTypes.object,
  onSubmit: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  submit: PropTypes.object,
}

AddAddressRangeAction.propTypes = ActionPropTypes
AddAddressRangeAction.displayName = 'AddAddressRangeActionButton'
UpdateAddressRangeAction.propTypes = ActionPropTypes
UpdateAddressRangeAction.displayName = 'UpdateAddressRangeActionButton'
DeleteAddressRangeAction.propTypes = ActionPropTypes
DeleteAddressRangeAction.displayName = 'DeleteAddressRangeAction'

export {
  AddAddressRangeAction,
  DeleteAddressRangeAction,
  UpdateAddressRangeAction,
}
