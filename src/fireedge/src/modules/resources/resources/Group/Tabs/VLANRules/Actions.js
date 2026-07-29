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
  MoreVert,
  Plus as AddIcon,
  Trash as TrashIcon,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'
import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'
import { AddVLANRuleForm } from '@modules/resources/resources/Group/Forms'
import { GroupAPI, useModalsApi } from '@FeaturesModule'
import { hasRestrictedAttributes } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import {
  RESTRICTED_ATTRIBUTES_TYPE,
  T,
  GROUP_ACTIONS,
  STYLE_BUTTONS,
} from '@ConstantsModule'
import { jsonToXml } from '@ModelsModule'

const AddVLANRuleAction = memo(
  ({ groupId, onSubmit, oneConfig, adminGroup }) => {
    const { showModal } = useModalsApi()
    const [vlanRuleGroup] = GroupAPI.useVlanRuleGroupMutation()

    const handleAdd = async (formData) => {
      if (typeof onSubmit === 'function') {
        return await onSubmit(formData)
      }

      const template = jsonToXml({ RULE: formData })
      await vlanRuleGroup({ id: groupId, vlanRules: template }).unwrap()
    }

    const handleAddForm = () =>
      showModal({
        id: 'add-vlan-rule',
        isFormDialog: true,
        dialogProps: {
          title: T['groups.actions.add-vlan-rule'],
          dataCy: 'modal-add-vlan-rule',
          steps: AddVLANRuleForm,
          stepProps: {
            groupId,
            oneConfig,
            adminGroup,
            restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.GROUP,
            nameParentAttribute: 'VLAN_RULES',
          },
        },
        onSubmit: handleAdd,
      })

    return (
      <Button
        data-cy="add-vlan-rule"
        startIcon={<AddIcon />}
        type={STYLE_BUTTONS.TYPE.PRIMARY}
        onClick={handleAddForm}
      >
        {T['groups.actions.add-vlan-rule']}
      </Button>
    )
  }
)

const VLANRuleActionsMenu = memo(
  ({
    groupId,
    vlanRule,
    vlanRuleId,
    onUpdate,
    onDelete,
    oneConfig,
    adminGroup,
    canUpdate = false,
    canDelete = false,
  }) => {
    const { translate } = useTranslation()
    const { showModal } = useModalsApi()
    const [vlanRuleGroup] = GroupAPI.useVlanRuleGroupMutation()
    const updateVLANRuleLabel = translate(T['groups.actions.update-vlan-rule'])
    const deleteVLANRuleLabel = translate(T.DeleteVLANRule)

    const isDeleteDisabled =
      !adminGroup &&
      hasRestrictedAttributes(
        vlanRule,
        'VLAN_RULES',
        oneConfig?.GROUP_RESTRICTED_ATTR
      )

    const handleUpdate = async (formData) => {
      if (typeof onUpdate === 'function') {
        return await onUpdate(formData)
      }

      const template = jsonToXml({ RULE: formData })
      await vlanRuleGroup({ id: groupId, vlanRules: template }).unwrap()
    }

    const handleRemove = async () => {
      if (typeof onDelete === 'function') {
        return await onDelete(vlanRuleId)
      }

      await vlanRuleGroup({ id: groupId, vlanRule: vlanRuleId }).unwrap()
    }

    const handleUpdateForm = () =>
      showModal({
        isFormDialog: true,
        dialogProps: {
          title:
            vlanRuleId !== undefined
              ? `${updateVLANRuleLabel}: #${vlanRuleId}`
              : updateVLANRuleLabel,
          dataCy: 'modal-update-vlan-rule',
          steps: AddVLANRuleForm,
          initialValues: vlanRule,
          stepProps: {
            isEditing: true,
            oneConfig,
            adminGroup,
            restrictedAttributesType: RESTRICTED_ATTRIBUTES_TYPE.GROUP,
            nameParentAttribute: 'VLAN_RULES',
          },
        },
        onSubmit: handleUpdate,
      })

    const handleDeleteForm = () =>
      showModal({
        id: 'delete-vlan-rule-' + (vlanRuleId ?? 'new'),
        cy: 'delete-vlan-rule',
        isConfirmDialog: true,
        dialogProps: {
          title:
            vlanRuleId !== undefined
              ? `${deleteVLANRuleLabel}: #${vlanRuleId}`
              : deleteVLANRuleLabel,
          description: (
            <ResourceActionConfirmation
              description={T['resource.delete.confirmation']}
              resources={{ ID: vlanRuleId }}
              resourceType={T.VLANRules}
            />
          ),
          confirmLabel: T.Delete,
          confirmButtonProps: {
            isDestructive: true,
          },
        },
        onSubmit: handleRemove,
      })

    const options = [
      canUpdate && {
        'data-cy': `${GROUP_ACTIONS.UPDATE_VLAN_RULE}-${vlanRuleId}`,
        title: T.Edit,
        startIcon: <EditIcon />,
        onClick: handleUpdateForm,
      },
      canDelete && {
        'data-cy': `${GROUP_ACTIONS.DELETE_VLAN_RULE}-${vlanRuleId}`,
        title: deleteVLANRuleLabel,
        startIcon: <TrashIcon />,
        onClick: handleDeleteForm,
        isDisabled: isDeleteDisabled,
      },
    ].filter(Boolean)

    if (!options.length) return null

    return <MenuButton iconOnly={<MoreVert />} options={[options]} />
  }
)

const ActionPropTypes = {
  groupId: PropTypes.string,
  vlanRule: PropTypes.object,
  vlanRuleId: PropTypes.number,
  onSubmit: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  canUpdate: PropTypes.bool,
  canDelete: PropTypes.bool,
}

AddVLANRuleAction.propTypes = ActionPropTypes
AddVLANRuleAction.displayName = 'AddVLANRuleActionButton'

VLANRuleActionsMenu.propTypes = ActionPropTypes
VLANRuleActionsMenu.displayName = 'VLANRuleActionsMenu'

export { AddVLANRuleAction, VLANRuleActionsMenu }
