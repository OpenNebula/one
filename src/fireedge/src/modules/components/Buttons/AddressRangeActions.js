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
import {
  Edit as EditIcon,
  Plus as AddIcon,
  Trash as TrashIcon,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'

import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { AddRangeForm } from '@modules/components/Forms/VNetwork'
import { VnAPI } from '@FeaturesModule'

import { Tr } from '@modules/components/HOC'
import {
  RESTRICTED_ATTRIBUTES_TYPE,
  T,
  VN_ACTIONS,
  STYLE_BUTTONS,
} from '@ConstantsModule'
import { jsonToXml } from '@ModelsModule'

import { hasRestrictedAttributes } from '@UtilsModule'

const AddAddressRangeAction = memo(
  ({ vnetId, onSubmit, oneConfig, adminGroup }) => {
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

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': 'add-ar',
          startIcon: <AddIcon />,
          label: T.AddressRange,
          importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
          size: STYLE_BUTTONS.SIZE.MEDIUM,
          type: STYLE_BUTTONS.TYPE.FILLED,
        }}
        options={[
          {
            dialogProps: {
              title: T.AddressRange,
              dataCy: 'modal-add-ar',
            },
            form: () => AddRangeForm(formConfig),
            onSubmit: handleAdd,
          },
        ]}
      />
    )
  }
)

const UpdateAddressRangeAction = memo(
  ({ vnetId, ar, onSubmit, oneConfig, adminGroup }) => {
    const [updateAR] = VnAPI.useUpdateVNetRangeMutation()
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
              title: AR_ID
                ? `${Tr(T.AddressRange)}: #${AR_ID}`
                : `${Tr(T.AddressRange)}`,
              dataCy: 'modal-update-ar',
            },
            form: () =>
              AddRangeForm({
                initialValues: ar,
                stepProps: {
                  isUpdate: !onSubmit && AR_ID !== undefined,
                  oneConfig,
                  adminGroup,
                  restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.VNET,
                  nameParentAttribute: 'AR',
                },
              }),
            onSubmit: handleUpdate,
          },
        ]}
      />
    )
  }
)

const DeleteAddressRangeAction = memo(
  ({ vnetId, ar, onSubmit, oneConfig, adminGroup }) => {
    const [removeAR] = VnAPI.useRemoveRangeFromVNetMutation()
    const { AR_ID } = ar

    const handleRemove = async () => {
      if (onSubmit && typeof onSubmit === 'function') {
        return await onSubmit(AR_ID)
      }

      await removeAR({ id: vnetId, address: AR_ID })
    }

    // Disable action if the disk has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      hasRestrictedAttributes(ar, 'AR', oneConfig?.VNET_RESTRICTED_ATTR)

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `${VN_ACTIONS.DELETE_AR}-${AR_ID}`,
          icon: <TrashIcon />,
          tooltip: !disabledAction ? Tr(T.Detach) : Tr(T.DetachRestricted),
          disabled: disabledAction,
        }}
        options={[
          {
            isConfirmDialog: true,
            dialogProps: {
              title: AR_ID
                ? `${Tr(T.DeleteAddressRange)}: #${AR_ID}`
                : `${Tr(T.DeleteAddressRange)}`,
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
            },
            onSubmit: handleRemove,
          },
        ]}
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
