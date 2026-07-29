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
  Button,
  DetailsDrawer,
  InfoSlot,
  LabelButton,
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
} from '@ComponentsV2Module'

import { useModalsApi, SecurityGroupAPI } from '@FeaturesModule'
import { Component, useMemo } from 'react'

import { T, STYLE_BUTTONS, RESOURCE_NAMES } from '@ConstantsModule'
import { SecurityGroup } from '@ResourcesModule'
import {
  getSecurityGroupResourceCount,
  getSecurityGroupRulesCount,
} from '@ModelsModule'

import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Trash, Cancel as CloseIcon } from 'iconoir-react'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedSecurityGroups - Selected Security Groups
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedSecurityGroups = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions,
}) => {
  const { showModal } = useModalsApi()
  const summary = useMemo(
    () =>
      selectedSecurityGroups.reduce(
        (totals, securityGroup) => ({
          rules: totals.rules + getSecurityGroupRulesCount(securityGroup),
          updatedVms:
            totals.updatedVms +
            getSecurityGroupResourceCount(securityGroup?.UPDATED_VMS),
          outdatedVms:
            totals.outdatedVms +
            getSecurityGroupResourceCount(securityGroup?.OUTDATED_VMS),
          errorVms:
            totals.errorVms +
            getSecurityGroupResourceCount(securityGroup?.ERROR_VMS),
        }),
        { rules: 0, updatedVms: 0, outdatedVms: 0, errorVms: 0 }
      ),
    [selectedSecurityGroups]
  )

  const [refreshSecGroup, { isFetching: isRefreshingSecGroup }] =
    SecurityGroupAPI.useLazyGetSecGroupQuery()

  const [remove, { isLoading: isRemoving }] =
    SecurityGroupAPI.useRemoveSecGroupMutation()

  const [changePermissions, { isLoading: isChangingPermissions }] =
    SecurityGroupAPI.useChangeSecGroupPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    SecurityGroupAPI.useChangeSecGroupOwnershipMutation()

  const handleRefresh = async () =>
    await Promise.all(
      selectedSecurityGroups.map(({ ID }) => refreshSecGroup({ id: ID }))
    )

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedSecurityGroups.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedSecurityGroups.map(({ ID }) =>
        changeOwnership({ id: ID, ...newOwnership })
      )
    )

    await handleRefresh()
  }

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.SecurityGroup}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedSecurityGroups}
            resourceType={T.SecurityGroups}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(
          selectedSecurityGroups.map(({ ID }) => remove({ id: ID }))
        )
        handleClose()
      },
    })

  const isMutating =
    isRemoving ||
    isRefreshingSecGroup ||
    isChangingOwnership ||
    isChangingPermissions

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedSecurityGroups?.length} ${T.SecurityGroups}  ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <LabelButton
                  selectedRows={selectedSecurityGroups}
                  resourceType={RESOURCE_NAMES.SEC_GROUP}
                  isDisabled={isMutating}
                />
                <Button
                  type={STYLE_BUTTONS.TYPE.PRIMARY}
                  size="small"
                  startIcon={<Trash width={'16px'} height={'16px'} />}
                  onClick={handleOpenDeleteForm}
                  isDestructive
                  isDisabled={isMutating}
                >
                  {T.DeleteSelected}
                </Button>

                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                  onClick={handleClose}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [summary.rules, T.TotalRules],
              [summary.updatedVms, T.TotalUpdatedVms],
              [summary.outdatedVms, T.TotalOutdatedVms],
              [summary.errorVms, T.TotalErrorVms],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: SecurityGroup.Tabs.Aggregated,
            resourceId: SecurityGroup.RID,
            tabProps: {
              selected: selectedSecurityGroups,
              handleChangeOwnership,
              handleChangePermission,
              handleSelect,
              handleDeselect,
            },
          },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedSecurityGroups: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
