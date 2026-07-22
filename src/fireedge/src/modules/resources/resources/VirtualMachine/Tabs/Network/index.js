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
  T,
  VM_ACTIONS,
  VM_ACTION_ENUM,
  STYLE_BUTTONS,
  PCI_TYPES,
} from '@ConstantsModule'
import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
  Table,
} from '@ComponentsV2Module'
import { Box, Dialog, Stack, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useMemo, useState } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Network/styles'
import Graphs from '@modules/resources/resources/VirtualMachine/Tabs/Network/graphs'
import { VirtualMachine } from '@modules/resources/resources'
import { Cancel, MoreVert, Plus, Trash } from 'iconoir-react'
import {
  SecurityGroupAPI,
  VmAPI,
  useGeneralApi,
  useModalsApi,
} from '@FeaturesModule'
import { getHypervisor, isVmAvailableAction, vmnicsTable } from '@ModelsModule'
import { jsonToXml } from '@UtilsModule'

const ALIAS_DIALOG_PROPS = {
  dialogWidth: {
    xs: 'calc(100vw - 32px)',
    md: '760px',
    lg: '840px',
  },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogMaxHeight: 'calc(100vh - 32px)',
  dialogContentMaxHeight: 'calc(100vh - 184px)',
  dialogContentOverflowY: 'auto',
  confirmLabel: T.Accept,
  cancelButtonProps: {
    sx: { display: 'none' },
  },
}

const TABLE_FORM_DIALOG_PROPS = {
  dialogWidth: {
    xs: 'calc(100vw - 32px)',
    md: '960px',
    lg: '1200px',
  },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogContentMaxHeight: '70vh',
  dialogContentOverflowY: 'auto',
}

const isPciNic = (nic) => Object.values(PCI_TYPES).includes(nic?.PCI_TYPE)

const getNicTemplate = (nic) =>
  jsonToXml(isPciNic(nic) ? { PCI: { ...nic, TYPE: 'NIC' } } : { NIC: nic })

const getSecurityGroupIds = (nic) => [
  ...new Set(
    [nic?.SECURITY_GROUPS ?? []]
      .flat()
      .flatMap((securityGroup) =>
        typeof securityGroup === 'object'
          ? securityGroup?.ID ?? securityGroup?.SECURITY_GROUP_ID
          : `${securityGroup}`.split(',')
      )
      .filter(Boolean)
      .map((securityGroupId) => +securityGroupId)
      .filter(Number.isFinite)
  ),
]

const getSecurityGroupId = (securityGroup) =>
  securityGroup?.ID ?? securityGroup?.SECURITY_GROUP_ID

const getAliasIds = (nic) =>
  `${nic?.ALIAS_IDS ?? ''}`.split(',').filter(Boolean)

const getAliasCount = (nic, nics = []) => {
  const aliasIds = getAliasIds(nic)

  return (
    aliasIds.length || nics.filter(({ PARENT }) => PARENT === nic?.NAME).length
  )
}

const getRulesCount = (securityGroup) =>
  [securityGroup?.TEMPLATE?.RULE ?? []].flat().filter(Boolean).length

const getNicSecurityGroups = (nic, securityGroups = []) => {
  const securityGroupIds = getSecurityGroupIds(nic)

  if (!securityGroupIds.length) return []

  const matchedSecurityGroups = securityGroups.filter((securityGroup) =>
    securityGroupIds.includes(+securityGroup.ID)
  )

  return matchedSecurityGroups.length
    ? matchedSecurityGroups
    : securityGroupIds.map((ID) => ({ ID, NAME: '-' }))
}

const SecurityGroupsDialog = ({
  isAddDisabled,
  isDetachDisabled,
  isLoading,
  nic,
  onAdd,
  onClose,
  onDetach,
  securityGroups,
}) => {
  const columns = useMemo(
    () => [
      { accessorKey: 'ID', header: T.ID, grow: false },
      { accessorKey: 'NAME', header: T.Name, truncate: true },
      {
        id: 'rules',
        header: T.Rules,
        cell: ({ row }) => getRulesCount(row.original),
      },
      { accessorKey: 'UNAME', header: T.Owner, grow: false },
      { accessorKey: 'GNAME', header: T.Group, grow: false },
      {
        id: 'actions',
        header: '',
        grow: false,
        cell: ({ row }) => {
          const securityGroup = row.original
          const securityGroupId = getSecurityGroupId(securityGroup)

          return (
            <Button
              data-cy={`detach-secgroup-${securityGroupId}-from-${nic?.NIC_ID}`}
              iconOnly={<Trash />}
              isDestructive
              isDisabled={isDetachDisabled}
              onClick={() => onDetach?.(nic, securityGroup)}
              title={T.DetachSecurityGroup}
              type={STYLE_BUTTONS.TYPE.TRANSPARENT}
            />
          )
        },
      },
    ],
    [isDetachDisabled, nic, onDetach]
  )

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <Stack
        direction="column"
        sx={(theme) => ({
          gap: `${theme.scale[300]}px`,
          padding: `${theme.scale[500]}px`,
        })}
      >
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
        >
          <Stack direction="column">
            <Typography variant="h5">{T.SecurityGroups}</Typography>
            <Typography color="text.secondary">
              {`${T.NIC} #${nic?.NIC_ID}`}
            </Typography>
          </Stack>
          <Button
            aria-label={T.Close}
            iconOnly={<Cancel />}
            onClick={onClose}
            title={T.Close}
            type="transparent"
          />
        </Stack>
        <Box display="flex" justifyContent="flex-start">
          <Button
            isDisabled={isAddDisabled}
            size="small"
            startIcon={<Plus width="16px" height="16px" />}
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            onClick={() => onAdd?.(nic)}
          >
            {T.AddSecurityGroup}
          </Button>
        </Box>
        <Table
          columns={columns}
          data={securityGroups}
          isLoading={isLoading}
          emptyContentProps={{
            title: T.NoSecurityGroups,
            subtitle: T.SecurityGroupsWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Stack>
    </Dialog>
  )
}

SecurityGroupsDialog.propTypes = {
  isAddDisabled: PropTypes.bool,
  isDetachDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  nic: PropTypes.object,
  onAdd: PropTypes.func,
  onClose: PropTypes.func,
  onDetach: PropTypes.func,
  securityGroups: PropTypes.array,
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const Network = ({ data, config }) => {
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const { selectedVm } = data || {}
  const [securityGroupsDialog, setSecurityGroupsDialog] = useState()
  const [detachSecurityGroup, { isLoading: isDetachingSecurityGroup }] =
    VmAPI.useDetachSecurityGroupMutation()

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context:
        (fn) =>
        (params = {}) =>
          fn?.({
            id: selectedVm?.ID,
            ...params,
          }),
    })

  const { data: nics = [], isFetching: isFetchingNics } = vmnicsTable.useData(
    { id: selectedVm?.ID },
    { skip: !selectedVm?.ID }
  )
  const { data: securityGroups = [], isFetching: isFetchingSecurityGroups } =
    SecurityGroupAPI.useGetSecGroupsQuery(undefined, {
      skip: !securityGroupsDialog,
    })
  const primaryNics = nics.filter(({ PARENT }) => PARENT === undefined)
  const networkActionKeys = VirtualMachine.Actions.Groups.Network.filter(
    (key) =>
      ![
        VM_ACTION_ENUM.ATTACH_NIC_ALIAS,
        VM_ACTION_ENUM.ATTACH_SEC_GROUP,
      ].includes(key)
  )
  const securityGroupsDialogNic = useMemo(() => {
    const nicId = securityGroupsDialog?.nic?.NIC_ID

    return (
      nics.find(({ NIC_ID }) => String(NIC_ID) === String(nicId)) ??
      securityGroupsDialog?.nic
    )
  }, [nics, securityGroupsDialog?.nic])
  const securityGroupsForDialog = useMemo(
    () => getNicSecurityGroups(securityGroupsDialogNic, securityGroups),
    [securityGroups, securityGroupsDialogNic]
  )
  const attachSecurityGroupOption = useMemo(
    () =>
      securityGroupsDialogNic
        ? VirtualMachine.Actions.Utils.generateMenuOptions({
            keys: [VM_ACTION_ENUM.ATTACH_SEC_GROUP],
            actions,
            vm: selectedVm,
            paramsContext: securityGroupsDialogNic,
            formContext: securityGroupsDialogNic,
            viewConfig: config,
            showModal,
          })?.[0]
        : undefined,
    [actions, config, securityGroupsDialogNic, selectedVm, showModal]
  )
  const isDetachSecurityGroupDisabled =
    isPerformingAction ||
    isDetachingSecurityGroup ||
    !config?.actions?.[VM_ACTIONS.DETACH_SEC_GROUP] ||
    !isVmAvailableAction(VM_ACTIONS.DETACH_SEC_GROUP, selectedVm)

  const handleAttachNic = async (formData) => {
    const result = await actions?.[VM_ACTION_ENUM.ATTACH_NIC]?.mutate({
      template: getNicTemplate(formData),
    })

    if (result?.error) return false
    enqueueSuccess(T.AttachNicSuccess, [selectedVm?.ID])
  }

  const handleAttachSecurityGroup =
    (nic) =>
    async ({ secgroup } = {}) => {
      const result = await actions?.[VM_ACTION_ENUM.ATTACH_SEC_GROUP]?.mutate({
        nic: nic?.NIC_ID,
        secgroup,
      })

      if (result?.error) return false
      enqueueSuccess(T.AttachSecurityGroupSuccess, [selectedVm?.ID])
    }

  const handleDetachSecurityGroup = (nic, securityGroup) => async () => {
    const securityGroupId = getSecurityGroupId(securityGroup)
    const result = await detachSecurityGroup({
      id: selectedVm?.ID,
      nic: nic?.NIC_ID,
      secgroup: securityGroupId,
    })

    if (result?.error) return false
    enqueueSuccess(T.DetachSecurityGroupSuccess, [selectedVm?.ID])
  }

  const handleUpdateNic = (nic) => async (formData) => {
    const result = await actions?.[VM_ACTION_ENUM.UPDATE_NIC]?.mutate({
      nic: nic?.NIC_ID,
      template: getNicTemplate(formData),
    })

    if (result?.error) return false
    enqueueSuccess(T.UpdatedNicSuccess, [selectedVm?.ID])
  }

  const handleDetachNic = (nic) => async () => {
    const result = await actions?.[VM_ACTION_ENUM.DETACH_NIC]?.mutate(nic)

    if (result?.error) return false
    enqueueSuccess(T.DetachNicSuccess, [selectedVm?.ID])
  }

  const openUpdateNicForm = (nic, option) =>
    showModal({
      name: option?.title,
      isFormDialog: true,
      dialogProps: {
        title: option?.title,
        dataCy: 'modal-update-nic',
        steps: actions?.[VM_ACTION_ENUM.UPDATE_NIC]?.form,
        initialValues: nic,
        update: true,
      },
      onSubmit: handleUpdateNic(nic),
    })

  const openDetachNicConfirm = (nic, option) =>
    showModal({
      name: option?.title,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSomething} ${T.NIC} #${nic?.NIC_ID}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.detach.confirmation']}
            resources={{ ID: nic?.NIC_ID, NAME: nic?.NAME }}
            resourceType={T.NIC}
          />
        ),
        dataCy: 'modal-detach-nic',
        confirmLabel: T.Detach,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleDetachNic(nic),
    })

  const openAttachSecurityGroupForm = (nic) =>
    showModal({
      name: T.AttachSecurityGroup,
      dialogProps: {
        ...TABLE_FORM_DIALOG_PROPS,
        title: T.AttachSecurityGroup,
        dataCy: 'modal-attach-secgroup',
      },
      form: VirtualMachine.Forms.AttachSecGroupForm(),
      onSubmit: handleAttachSecurityGroup(nic),
    })

  const openDetachSecurityGroupConfirm = (nic, securityGroup) => {
    const securityGroupId = getSecurityGroupId(securityGroup)

    return showModal({
      name: T.DetachSecurityGroup,
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.DetachSecurityGroup} ${securityGroupId} ${T.FromNic} #${nic?.NIC_ID}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.detach.confirmation']}
            resources={{ ID: securityGroupId }}
            resourceType={T.SecurityGroup}
          />
        ),
        dataCy: `modal-detach-secgroup-${securityGroupId}-from-${nic?.NIC_ID}`,
        confirmLabel: T.Detach,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleDetachSecurityGroup(nic, securityGroup),
    })
  }

  const openAliasForm = (nic) =>
    showModal({
      name: T.Alias,
      dialogProps: {
        ...ALIAS_DIALOG_PROPS,
        title: `${T.Alias} - ${nic?.NAME}`,
        dataCy: 'modal-show-alias',
      },
      form: VirtualMachine.Forms.AliasForm({
        stepProps: {
          parent: nic?.NAME,
          vmId: selectedVm?.ID,
        },
        initialValues: {
          ALIAS: nics,
        },
      }),
    })

  const openSecurityGroupsDialog = (nic) =>
    setSecurityGroupsDialog({
      nic,
    })

  const closeSecurityGroupsDialog = () => setSecurityGroupsDialog()

  const columns = [
    ...vmnicsTable.columns(),
    {
      header: T.SecurityGroups,
      id: 'security-groups',
      cell: ({ row }) => getSecurityGroupIds(row?.original).length,
    },
    {
      header: T.Alias,
      id: 'alias',
      cell: ({ row }) => getAliasCount(row?.original, nics),
    },
    {
      header: '',
      id: 'actions',
      grow: false,
      cell: ({ row }) => {
        const nic = row?.original
        const networkOptions =
          VirtualMachine.Actions.Utils.generateMenuOptions({
            keys: networkActionKeys,
            actions,
            vm: selectedVm,
            paramsContext: nic,
            formContext: nic,
            viewConfig: config,
            showModal,
          })?.map((option) => {
            if (option?.eACTION === VM_ACTION_ENUM.UPDATE_NIC) {
              return {
                ...option,
                onClick: () => openUpdateNicForm(nic, option),
              }
            }

            if (option?.eACTION === VM_ACTION_ENUM.DETACH_NIC) {
              return {
                ...option,
                onClick: () => openDetachNicConfirm(nic, option),
              }
            }

            return option
          }) ?? []

        return (
          <MenuButton
            iconOnly={<MoreVert />}
            options={[
              [
                ...networkOptions,
                {
                  title: T.SecurityGroups,
                  tooltip: T.SecurityGroups,
                  onClick: () => openSecurityGroupsDialog(nic),
                },
                {
                  title: T.Alias,
                  tooltip: T.Alias,
                  isDisabled: !nic?.NAME,
                  onClick: () => openAliasForm(nic),
                },
              ],
            ]}
          />
        )
      },
    },
  ]

  const [attachNicOption] = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: [VM_ACTION_ENUM.ATTACH_NIC],
    actions,
    vm: selectedVm,
    viewConfig: config,
    showModal,
  })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Button
        {...attachNicOption}
        type={STYLE_BUTTONS.TYPE.SECONDARY}
        onClick={() =>
          showModal({
            name: attachNicOption?.title,
            isFormDialog: true,
            dialogProps: {
              title: attachNicOption?.title,
              dataCy: 'modal-attach-nic',
              steps: actions?.[VM_ACTION_ENUM.ATTACH_NIC]?.form,
              stepProps: {
                hypervisor: getHypervisor(selectedVm),
                nics,
              },
            },
            onSubmit: handleAttachNic,
          })
        }
      />
      <Box className="table-container">
        <Table
          columns={columns}
          data={primaryNics}
          isLoading={isFetchingNics || isPerformingAction}
          emptyContentProps={{
            title: T.NoNics,
            subtitle: T.AttachedNicsWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Box>
      <Box className="graph-container">
        <Graphs id={selectedVm?.ID} />
      </Box>
      {!!securityGroupsDialog && (
        <SecurityGroupsDialog
          isAddDisabled={
            isPerformingAction || attachSecurityGroupOption?.isDisabled
          }
          isDetachDisabled={isDetachSecurityGroupDisabled}
          isLoading={isFetchingSecurityGroups}
          nic={securityGroupsDialogNic}
          onAdd={openAttachSecurityGroupForm}
          onClose={closeSecurityGroupsDialog}
          onDetach={openDetachSecurityGroupConfirm}
          securityGroups={securityGroupsForDialog}
        />
      )}
    </Box>
  )
}

Network.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Network.id = 'network'
Network.title = T.Network
