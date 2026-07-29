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
import { Component, useMemo } from 'react'
import { Box } from '@mui/material'
import { MoreVert } from 'iconoir-react'
import {
  Button,
  MenuButton,
  ResourceActionConfirmation,
  TablePanel,
} from '@ComponentsV2Module'
import { ChangeForm } from '@modules/resources/resources/SecurityGroups/Forms'
import { STYLE_BUTTONS, T, VN_ACTIONS } from '@ConstantsModule'
import { SecurityGroupAPI, VnAPI, useModalsApi } from '@FeaturesModule'
import { jsonToXml } from '@UtilsModule'

const getSecurityGroupIds = (vnet) =>
  [vnet?.TEMPLATE?.SECURITY_GROUPS ?? []]
    .flat()
    .flatMap((securityGroupIds) => `${securityGroupIds}`.split(','))
    .filter(Boolean)
    .map((securityGroupId) => +securityGroupId)
    .filter(Number.isFinite)

const getRulesCount = (securityGroup) =>
  [securityGroup?.TEMPLATE?.RULE ?? []].flat().filter(Boolean).length

const getTemplateWithSecurityGroups = (
  template = {},
  securityGroupIds = []
) => {
  const { SECURITY_GROUPS: _securityGroups, ...rest } = template

  return securityGroupIds.length
    ? { ...rest, SECURITY_GROUPS: securityGroupIds.join(',') }
    : rest
}

const dialogWidth = {
  xs: 'calc(100vw - 32px)',
  md: '960px',
  lg: '1200px',
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Virtual Network security groups tab
 */
export const Security = ({ data, config }) => {
  const { vnet = {}, handleRefresh, isActionsDisabled, isLocked } = data || {}

  // API
  const { showModal } = useModalsApi()
  const { data: securityGroups = [], isFetching } =
    SecurityGroupAPI.useGetSecGroupsQuery()
  const [update, { isLoading: isUpdating }] = VnAPI.useUpdateVNetMutation()

  // State
  const actions = config?.actions ?? {}
  const canSelectSecGroups = actions[VN_ACTIONS.ADD_SECGROUP] === true
  const canRemoveSecGroup = actions[VN_ACTIONS.DELETE_SECGROUP] === true
  const areActionsDisabled = isActionsDisabled || isLocked || isUpdating

  const securityGroupIds = useMemo(() => getSecurityGroupIds(vnet), [vnet])
  const vnetSecurityGroups = useMemo(
    () =>
      securityGroups.filter((securityGroup) =>
        securityGroupIds.includes(+securityGroup.ID)
      ),
    [securityGroups, securityGroupIds]
  )

  // Table
  const columns = [
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

        return (
          <Box
            data-cy={`secgroup-actions-${securityGroup?.ID}`}
            display="flex"
            justifyContent="flex-end"
          >
            <MenuButton
              iconOnly={<MoreVert />}
              options={[
                [
                  {
                    title: T.Remove,
                    dataCy: `provision-secgroup-unbind-${securityGroup?.ID}`,
                    isDestructive: true,
                    isDisabled: !canRemoveSecGroup || areActionsDisabled,
                    onClick: () => handleRemoveSecurityGroupForm(securityGroup),
                  },
                ],
              ]}
            />
          </Box>
        )
      },
    },
  ]

  // Actions
  const updateSecurityGroups = async (nextSecurityGroupIds) => {
    const template = jsonToXml(
      getTemplateWithSecurityGroups(vnet?.TEMPLATE, nextSecurityGroupIds)
    )

    await update({ id: vnet?.ID, template }).unwrap()
    await handleRefresh?.()
  }

  const handleSelectSecurityGroups = async ({ secgroups }) => {
    const selectedSecurityGroupIds = [secgroups]
      .flat()
      .filter(Boolean)
      .map(String)

    await updateSecurityGroups(selectedSecurityGroupIds)
  }

  const handleRemoveSecurityGroup = async (securityGroupId) => {
    await updateSecurityGroups(
      securityGroupIds
        .map(String)
        .filter(
          (currentSecurityGroupId) =>
            currentSecurityGroupId !== String(securityGroupId)
        )
    )
  }

  // Modals
  const handleSelectSecurityGroupsForm = () =>
    showModal({
      dialogProps: {
        title: T.SelectSecurityGroups,
        dataCy: 'modal-select-security-groups',
        dialogWidth,
        dialogMaxWidth: 'calc(100vw - 32px)',
        dialogContentMaxHeight: '70vh',
      },
      form: ChangeForm({
        initialValues: securityGroupIds.map(String),
        stepProps: { isCopyColumn: true },
      }),
      onSubmit: handleSelectSecurityGroups,
    })

  const handleRemoveSecurityGroupForm = (securityGroup) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Remove} ${T.SecurityGroup}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.remove.confirmation']}
            resources={securityGroup}
            resourceType={T.SecurityGroups}
          />
        ),
        confirmLabel: T.Remove,
        cancelLabel: T.Cancel,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: () => handleRemoveSecurityGroup(securityGroup?.ID),
    })

  return (
    <Box display="flex" flexDirection="column" gap="1em">
      {canSelectSecGroups && (
        <Box display="flex" justifyContent="flex-start">
          <Button
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            size="small"
            dataCy="action-add_secgroup"
            onClick={handleSelectSecurityGroupsForm}
            isDisabled={areActionsDisabled}
          >
            {T.SelectSecurityGroups}
          </Button>
        </Box>
      )}
      <TablePanel
        dataCy="secgroup"
        key="virtual-network-security-groups-table"
        columns={columns}
        data={vnetSecurityGroups}
        isLoading={isFetching}
      />
    </Box>
  )
}

Security.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Security.id = 'security'
Security.title = T.SecurityGroups
