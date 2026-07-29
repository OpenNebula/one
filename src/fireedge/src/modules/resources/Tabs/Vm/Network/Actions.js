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
import { Edit, ShieldAdd, ShieldCross, Trash, EyeAlt } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'

import {
  AttachNicForm,
  AttachSecGroupForm,
  UpdateNicForm,
  AliasForm,
  AttachAliasForm,
} from '@modules/resources/resources/VirtualMachine/Forms'
import { VmAPI, useGeneralApi, useModalsApi } from '@FeaturesModule'
import { sentenceCase, hasRestrictedAttributes } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

import { T, STYLE_BUTTONS } from '@ConstantsModule'

import { useDisableStep } from '@modules/resources/FormStepper'
import { SubmitButton } from '@ComponentsV2Module'

const AttachAction = memo(
  ({
    hypervisor,
    nic,
    currentNics,
    onSubmit,
    oneConfig,
    adminGroup,
    indexNic,
    indexPci,
    hasAlias,
    isPci,
    isAlias,
    disableNetworkAutoMode,
  }) => {
    const { translate } = useTranslation()
    const { setFieldPath } = useGeneralApi()
    const disableSteps = useDisableStep()
    const { showModal } = useModalsApi()

    const openAttachActionForm = () => {
      if (nic) {
        if (isPci) {
          setFieldPath(`extra.PciDevices.PCI.${indexPci}`)
        } else {
          setFieldPath(`extra.Network.NIC.${indexNic}`)
        }
      } else {
        setFieldPath(`extra.Network.NIC.${currentNics.length}`)
      }

      return showModal({
        dialogProps: { title: T.AttachNic, dataCy: 'modal-attach-nic' },
        form: AttachNicForm({
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
        }),
        onSubmit: onSubmit,
      })
    }

    return (
      <SubmitButton
        {...(nic
          ? {
              'data-cy': `edit-${nic.NIC_ID}`,
              iconOnly: <Edit />,
              tooltip: translate(T.Edit),
            }
          : {
              'data-cy': 'add-nic',
              label: T.AttachNic,
              variant: STYLE_BUTTONS.TYPE.PRIMARY,
            })}
        onClick={openAttachActionForm}
      />
    )
  }
)

const DetachAction = memo(({ nic, onSubmit, oneConfig, adminGroup, vmId }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()
  // Disable action if is a regular user and is dettaching a nic in a template and if the nic has a restricted attribute on the template
  const disabledAction =
    !adminGroup &&
    !vmId &&
    hasRestrictedAttributes(nic, 'NIC', oneConfig?.VM_RESTRICTED_ATTR)

  const openDetachForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSomething}
              ${T.NIC} #${nic.NIC_ID}`,
        children: <p>{T.DoYouWantProceed}</p>,
      },
      onSubmit: onSubmit,
    })

  return (
    <SubmitButton
      data-cy={`detach-nic-${nic.NIC_ID}`}
      iconOnly={<Trash />}
      tooltip={
        !disabledAction ? translate(T.Detach) : translate(T.DetachRestricted)
      }
      disabled={disabledAction}
      onClick={openDetachForm}
    />
  )
})

const UpdateAction = memo(({ nic, onSubmit, oneConfig, adminGroup }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()

  const openUpdateForm = () =>
    showModal({
      dialogProps: { title: T.Update, dataCy: 'modal-update-nic' },
      form: UpdateNicForm({
        stepProps: {
          defaultData: nic,
          oneConfig,
          adminGroup,
        },
        initialValues: nic,
      }),
      onSubmit: onSubmit,
    })

  return (
    <SubmitButton
      data-cy={`update-nic-${nic.NIC_ID}`}
      iconOnly={<Edit />}
      tooltip={translate(T.Update)}
      onClick={openUpdateForm}
    />
  )
})

const AliasAction = memo(({ nic, alias, vmId, methods }) => {
  const { translate } = useTranslation()
  const { NIC_ID, NAME } = nic
  const { showModal } = useModalsApi()

  const openAliasForm = () =>
    showModal({
      dialogProps: {
        title: `${T.Alias} - ${NAME}`,
        dataCy: 'modal-show-alias',
      },
      form: AliasForm({
        stepProps: {
          parent: nic.NAME,
          methods: methods,
          vmId: vmId,
        },
        initialValues: {
          ALIAS: alias,
        },
      }),
    })

  return (
    <SubmitButton
      data-cy={`alias-nic-${NIC_ID}`}
      iconOnly={<EyeAlt />}
      tooltip={translate(T.Alias)}
      onClick={openAliasForm}
    />
  )
})

const AttachAliasAction = memo(
  ({
    hypervisor,
    alias,
    currentNics,
    onSubmit,
    oneConfig,
    adminGroup,
    indexAlias,
    indexNicAlias,
  }) => {
    const { translate } = useTranslation()
    const { setFieldPath } = useGeneralApi()
    const { showModal } = useModalsApi()

    const openAttachAliasForm = () => {
      setFieldPath(`extra.Network.NIC_ALIAS.${indexAlias}`)

      showModal({
        dialogProps: { title: T.AttachAlias, dataCy: 'modal-attach-alias' },
        form: AttachAliasForm({
          stepProps: {
            hypervisor,
            nics: currentNics,
            defaultData: alias,
            oneConfig,
            adminGroup,
            isAlias: true,
          },
          initialValues: alias,
        }),
        onSubmit: onSubmit,
      })
    }

    return (
      <SubmitButton
        {...(alias
          ? {
              'data-cy': `edit-${indexNicAlias}`,
              iconOnly: <Edit />,
              tooltip: translate(T.Edit),
            }
          : {
              'data-cy': 'add-alias',
              label: T.CreateAlias,
            })}
        onClick={openAttachAliasForm}
      />
    )
  }
)

const DetachAliasAction = memo(
  ({ alias, onSubmit, oneConfig, adminGroup, indexNicAlias }) => {
    const { translate } = useTranslation()
    const { showModal } = useModalsApi()
    // Disable action if the nic has a restricted attribute on the template
    const disabledAction =
      !adminGroup &&
      hasRestrictedAttributes(alias, 'NIC_ALIAS', oneConfig?.VM_RESTRICTED_ATTR)

    const openDetachAliasForm = () =>
      showModal({
        isConfirmDialog: true,
        dialogProps: {
          title: `${T.DetachSomething} ${T.Alias}`,
          children: <p>{T.DoYouWantProceed}</p>,
          dataCy: 'modal-detach-alias',
        },
        onSubmit: onSubmit,
      })

    return (
      <SubmitButton
        data-cy={`detach-alias-${indexNicAlias}-action`}
        iconOnly={<Trash />}
        tooltip={
          !disabledAction ? translate(T.Detach) : translate(T.DetachRestricted)
        }
        disabled={disabledAction}
        onClick={openDetachAliasForm}
      />
    )
  }
)

const AttachSecGroupAction = memo(({ vmId, nic, onSubmit }) => {
  const { translate } = useTranslation()
  const { showModal } = useModalsApi()
  const [attachSecGroup] = VmAPI.useAttachSecurityGroupMutation()
  const { NIC_ID } = nic

  const handleAttachNic = async ({ secgroup } = {}) => {
    const handleAttachSecGroup = onSubmit ?? attachSecGroup

    secgroup !== undefined &&
      (await handleAttachSecGroup({ id: vmId, nic: NIC_ID, secgroup }))
  }

  const handleOpenAttachForm = () =>
    showModal({
      dialogProps: {
        title: T.AttachSecurityGroup,
        dataCy: 'modal-attach-secgroup',
        validateOn: 'onSubmit',
      },
      form: AttachSecGroupForm,
      onSubmit: handleAttachNic,
    })

  return (
    <SubmitButton
      data-cy={`attach-secgroup-${NIC_ID}`}
      iconOnly={<ShieldAdd />}
      tooltip={translate(T.AttachSecurityGroup)}
      onClick={handleOpenAttachForm}
    />
  )
})

const DetachSecGroupAction = memo(
  ({ vmId, nic, securityGroupId, onSubmit }) => {
    const { translate } = useTranslation()
    const { showModal } = useModalsApi()
    const [detachSecGroup] = VmAPI.useDetachSecurityGroupMutation()
    const { NIC_ID } = nic

    const handleDetachNic = async () => {
      const handleDetachSecGroup = onSubmit ?? detachSecGroup
      const data = { id: vmId, nic: NIC_ID, secgroup: securityGroupId }
      await handleDetachSecGroup(data)
    }

    const handleOpenDetachForm = () =>
      showModal({
        isConfirmDialog: true,
        dialogProps: {
          title: sentenceCase(
            `${T.DetachSecurityGroup} ${securityGroupId} ${T.FromNic} #${NIC_ID}`
          ),
          children: <p>{T.DoYouWantProceed}</p>,
        },
        onSubmit: handleDetachNic,
      })

    return (
      <SubmitButton
        data-cy={`detach-secgroup-${securityGroupId}-from-${NIC_ID}`}
        iconOnly={<ShieldCross />}
        tooltip={translate(T.DetachSecurityGroup)}
        onClick={handleOpenDetachForm}
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
