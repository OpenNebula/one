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
import { Edit, ShieldAdd, ShieldCross, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, useEffect } from 'react'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import {
  AttachNicForm,
  AttachSecGroupForm,
  UpdateNicForm,
} from 'client/components/Forms/Vm'
import {
  useAttachNicMutation,
  useAttachSecurityGroupMutation,
  useDetachNicMutation,
  useDetachSecurityGroupMutation,
  useUpdateNicMutation,
} from 'client/features/OneApi/vm'

import { Tr, Translate } from 'client/components/HOC'
import { T } from 'client/constants'
import { useGeneralApi } from 'client/features/General'
import { jsonToXml } from 'client/models/Helper'

import { hasRestrictedAttributes } from 'client/utils'

const AttachAction = memo(
  ({
    vmId,
    hypervisor,
    nic,
    currentNics,
    onSubmit,
    sx,
    oneConfig,
    adminGroup,
  }) => {
    const [attachNic] = useAttachNicMutation()

    const handleAttachNic = async (formData) => {
      if (onSubmit && typeof onSubmit === 'function') {
        return await onSubmit(formData)
      }

      const isAlias = !!formData?.PARENT?.length
      const key = isAlias ? 'NIC_ALIAS' : 'NIC'
      const data = { [key]: formData }

      const template = jsonToXml(data)
      await attachNic({ id: vmId, template })
    }

    return (
      <ButtonToTriggerForm
        buttonProps={
          nic
            ? {
                'data-cy': `edit-${nic.NIC_ID}`,
                icon: <Edit />,
                tooltip: Tr(T.Edit),
                sx,
              }
            : {
                color: 'secondary',
                'data-cy': 'add-nic',
                label: T.AttachNic,
                variant: 'outlined',
                sx,
              }
        }
        options={[
          {
            dialogProps: { title: T.AttachNic, dataCy: 'modal-attach-nic' },
            form: () =>
              AttachNicForm({
                stepProps: {
                  hypervisor,
                  nics: currentNics,
                  defaultData: nic,
                  oneConfig,
                  adminGroup,
                },
                initialValues: nic,
              }),
            onSubmit: handleAttachNic,
          },
        ]}
      />
    )
  }
)

const DetachAction = memo(
  ({ vmId, nic, onSubmit, sx, oneConfig, adminGroup }) => {
    const [detachNic] = useDetachNicMutation()
    const { NIC_ID, PARENT } = nic
    const isAlias = !!PARENT?.length

    const handleDetach = async () => {
      const handleDetachNic = onSubmit ?? detachNic
      await handleDetachNic({ id: vmId, nic: NIC_ID })
    }

    // Disable action if the nic has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      hasRestrictedAttributes(nic, 'NIC', oneConfig?.VM_RESTRICTED_ATTR)

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `detach-nic-${NIC_ID}`,
          icon: <Trash />,
          tooltip: !disabledAction ? Tr(T.Detach) : Tr(T.DetachRestricted),
          sx,
          disabled: disabledAction,
        }}
        options={[
          {
            isConfirmDialog: true,
            dialogProps: {
              title: (
                <Translate
                  word={T.DetachSomething}
                  values={`${isAlias ? T.Alias : T.NIC} #${NIC_ID}`}
                />
              ),
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
            },
            onSubmit: handleDetach,
          },
        ]}
      />
    )
  }
)

const UpdateAction = memo(({ vmId, nic, sx }) => {
  const { enqueueSuccess } = useGeneralApi()
  const [updateNic, { isSuccess }] = useUpdateNicMutation()
  const { NIC_ID } = nic

  const handleUpdate = async (formData) => {
    const data = { NIC: formData }
    const template = jsonToXml(data)

    await updateNic({
      id: vmId,
      nic: NIC_ID,
      template,
    })
  }
  const updatedNicMessage = `${Tr(T.UpdatedNic)} - ${Tr(T.ID)} : ${NIC_ID}`

  useEffect(() => isSuccess && enqueueSuccess(updatedNicMessage), [isSuccess])

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `update-nic-${NIC_ID}`,
        icon: <Edit />,
        tooltip: Tr(T.Update),
        sx,
      }}
      options={[
        {
          dialogProps: { title: T.Update, dataCy: 'modal-update-nic' },
          form: () =>
            UpdateNicForm({
              stepProps: { defaultData: nic },
              initialValues: nic,
            }),
          onSubmit: handleUpdate,
        },
      ]}
    />
  )
})

const AttachSecGroupAction = memo(({ vmId, nic, onSubmit, sx }) => {
  const [attachSecGroup] = useAttachSecurityGroupMutation()
  const { NIC_ID } = nic

  const handleAttachNic = async ({ secgroup } = {}) => {
    const handleAttachSecGroup = onSubmit ?? attachSecGroup

    secgroup !== undefined &&
      (await handleAttachSecGroup({ id: vmId, nic: NIC_ID, secgroup }))
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `attach-secgroup-${NIC_ID}`,
        icon: <ShieldAdd />,
        tooltip: Tr(T.AttachSecurityGroup),
        sx,
      }}
      options={[
        {
          dialogProps: {
            title: T.AttachSecurityGroup,
            dataCy: 'modal-attach-secgroup',
          },
          form: AttachSecGroupForm,
          onSubmit: handleAttachNic,
        },
      ]}
    />
  )
})

const DetachSecGroupAction = memo(
  ({ vmId, nic, securityGroupId, onSubmit, sx }) => {
    const [detachSecGroup] = useDetachSecurityGroupMutation()
    const { NIC_ID } = nic

    const handleDetachNic = async () => {
      const handleDetachSecGroup = onSubmit ?? detachSecGroup
      const data = { id: vmId, nic: NIC_ID, secgroup: securityGroupId }
      await handleDetachSecGroup(data)
    }

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `detach-secgroup-${securityGroupId}-from-${NIC_ID}`,
          icon: <ShieldCross />,
          tooltip: Tr(T.DetachSecurityGroup),
          sx,
        }}
        options={[
          {
            isConfirmDialog: true,
            dialogProps: {
              title: (
                <Translate
                  word={T.DetachSecurityGroupFromNic}
                  values={[`#${securityGroupId}`, `#${NIC_ID}`]}
                />
              ),
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
            },
            onSubmit: handleDetachNic,
          },
        ]}
      />
    )
  }
)

const ActionPropTypes = {
  vmId: PropTypes.string,
  hypervisor: PropTypes.string,
  currentNics: PropTypes.array,
  nic: PropTypes.object,
  securityGroupId: PropTypes.string,
  onSubmit: PropTypes.func,
  sx: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

AttachAction.propTypes = ActionPropTypes
AttachAction.displayName = 'AttachActionButton'
DetachAction.propTypes = ActionPropTypes
DetachAction.displayName = 'DetachActionButton'
UpdateAction.propTypes = ActionPropTypes
UpdateAction.displayName = 'UpdateActionButton'
AttachSecGroupAction.propTypes = ActionPropTypes
AttachSecGroupAction.displayName = 'AttachSecGroupButton'
DetachSecGroupAction.propTypes = ActionPropTypes
DetachSecGroupAction.displayName = 'DetachSecGroupButton'

export {
  AttachAction,
  DetachAction,
  UpdateAction,
  AttachSecGroupAction,
  DetachSecGroupAction,
}
