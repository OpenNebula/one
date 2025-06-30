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
import { Edit, ShieldAdd, ShieldCross, Trash, EyeAlt } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'

import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import {
  AttachNicForm,
  AttachSecGroupForm,
  UpdateNicForm,
  AliasForm,
  AttachAliasForm,
} from '@modules/components/Forms/Vm'
import { VmAPI, useGeneralApi } from '@FeaturesModule'

import { Tr, Translate } from '@modules/components/HOC'
import { T, STYLE_BUTTONS } from '@ConstantsModule'

import { hasRestrictedAttributes } from '@UtilsModule'
import { useDisableStep } from '@modules/components/FormStepper'

const AttachAction = memo(
  ({
    hypervisor,
    nic,
    currentNics,
    onSubmit,
    sx,
    oneConfig,
    adminGroup,
    indexNic,
    indexPci,
    hasAlias,
    isPci,
    isAlias,
    disableNetworkAutoMode,
  }) => {
    const { setFieldPath } = useGeneralApi()
    const disableSteps = useDisableStep()

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
                'data-cy': 'add-nic',
                label: T.AttachNic,
                sx,
                importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
              }
        }
        options={[
          {
            dialogProps: { title: T.AttachNic, dataCy: 'modal-attach-nic' },
            form: () => {
              // Set field path
              if (nic) {
                if (isPci) {
                  setFieldPath(`extra.PciDevices.PCI.${indexPci}`)
                } else {
                  setFieldPath(`extra.Network.NIC.${indexNic}`)
                }
              } else {
                setFieldPath(`extra.Network.NIC.${currentNics.length}`)
              }

              return AttachNicForm({
                stepProps: {
                  hypervisor,
                  nics: currentNics,
                  defaultData: nic,
                  oneConfig,
                  adminGroup,
                  hasAlias,
                  isPci,
                  isAlias,
                  disableSteps,
                  disableNetworkAutoMode,
                },
                initialValues: nic,
              })
            },
            onSubmit: onSubmit,
          },
        ]}
      />
    )
  }
)

const DetachAction = memo(
  ({ nic, onSubmit, sx, oneConfig, adminGroup, vmId }) => {
    // Disable action if is a regular user and is dettaching a nic in a template and if the nic has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      !vmId &&
      hasRestrictedAttributes(nic, 'NIC', oneConfig?.VM_RESTRICTED_ATTR)

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `detach-nic-${nic.NIC_ID}`,
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
                  values={`${T.NIC} #${nic.NIC_ID}`}
                />
              ),
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
            },
            onSubmit: onSubmit,
          },
        ]}
      />
    )
  }
)

const UpdateAction = memo(({ nic, onSubmit, sx, oneConfig, adminGroup }) => (
  <ButtonToTriggerForm
    buttonProps={{
      'data-cy': `update-nic-${nic.NIC_ID}`,
      icon: <Edit />,
      tooltip: Tr(T.Update),
      sx,
    }}
    options={[
      {
        dialogProps: { title: T.Update, dataCy: 'modal-update-nic' },
        form: () =>
          UpdateNicForm({
            stepProps: {
              defaultData: nic,
              oneConfig,
              adminGroup,
            },
            initialValues: nic,
          }),
        onSubmit: onSubmit,
      },
    ]}
  />
))

const AliasAction = memo(({ nic, alias, vmId, methods }) => {
  const { NIC_ID, NAME } = nic

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `alias-nic-${NIC_ID}`,
        icon: <EyeAlt />,
        tooltip: Tr(T.Alias),
      }}
      options={[
        {
          dialogProps: {
            title: `${Tr(T.Alias)} - ${NAME}`,
            dataCy: 'modal-show-alias',
          },
          form: () =>
            AliasForm({
              stepProps: {
                parent: nic.NAME,
                methods: methods,
                vmId: vmId,
              },
              initialValues: {
                ALIAS: alias,
              },
            }),
        },
      ]}
    />
  )
})

const AttachAliasAction = memo(
  ({
    hypervisor,
    alias,
    currentNics,
    onSubmit,
    sx,
    oneConfig,
    adminGroup,
    indexAlias,
    indexNicAlias,
  }) => {
    const { setFieldPath } = useGeneralApi()

    return (
      <ButtonToTriggerForm
        buttonProps={
          alias
            ? {
                'data-cy': `edit-${indexNicAlias}`,
                icon: <Edit />,
                tooltip: Tr(T.Edit),
                sx,
              }
            : {
                'data-cy': 'add-alias',
                label: T.CreateAlias,
                importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
                sx,
              }
        }
        options={[
          {
            dialogProps: { title: T.AttachAlias, dataCy: 'modal-attach-alias' },
            form: () => {
              setFieldPath(`extra.Network.NIC_ALIAS.${indexAlias}`)

              return AttachAliasForm({
                stepProps: {
                  hypervisor,
                  nics: currentNics,
                  defaultData: alias,
                  oneConfig,
                  adminGroup,
                  isAlias: true,
                },
                initialValues: alias,
              })
            },
            onSubmit: onSubmit,
          },
        ]}
      />
    )
  }
)

const DetachAliasAction = memo(
  ({ alias, onSubmit, sx, oneConfig, adminGroup, indexNicAlias }) => {
    // Disable action if the nic has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      hasRestrictedAttributes(alias, 'NIC_ALIAS', oneConfig?.VM_RESTRICTED_ATTR)

    return (
      <ButtonToTriggerForm
        buttonProps={{
          'data-cy': `detach-alias-${indexNicAlias}-action`,
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
                <Translate word={T.DetachSomething} values={`${T.Alias}`} />
              ),
              children: <p>{Tr(T.DoYouWantProceed)}</p>,
              dataCy: 'modal-detach-alias',
            },
            onSubmit: onSubmit,
          },
        ]}
      />
    )
  }
)

const AttachSecGroupAction = memo(({ vmId, nic, onSubmit, sx }) => {
  const [attachSecGroup] = VmAPI.useAttachSecurityGroupMutation()
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
            validateOn: 'onSubmit',
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
    const [detachSecGroup] = VmAPI.useDetachSecurityGroupMutation()
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
  indexNic: PropTypes.number,
  indexAlias: PropTypes.number,
  indexPci: PropTypes.number,
  hasAlias: PropTypes.bool,
  isPci: PropTypes.bool,
  isAlias: PropTypes.bool,
  alias: PropTypes.array,
  methods: PropTypes.object,
  index: PropTypes.number,
  indexNicAlias: PropTypes.number,
  disableNetworkAutoMode: PropTypes.bool,
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
AttachAliasAction.propTypes = ActionPropTypes
AttachAliasAction.displayName = 'AttachAliasAction'
DetachAliasAction.propTypes = ActionPropTypes
DetachAliasAction.displayName = 'DetachAliasAction'
AliasAction.propTypes = ActionPropTypes
AliasAction.displayName = 'AliasAction'

export {
  AttachAction,
  DetachAction,
  UpdateAction,
  AttachSecGroupAction,
  DetachSecGroupAction,
  AliasAction,
  AttachAliasAction,
  DetachAliasAction,
}
