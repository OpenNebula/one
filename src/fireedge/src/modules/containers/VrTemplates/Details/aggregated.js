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
  DetailsDrawer,
  InfoSlot,
  LabelButton,
  SummarySlot,
  TabSlot,
  ButtonGroup,
  Button,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'
import { useModalsApi, VmTemplateAPI, VrTemplateAPI } from '@FeaturesModule'
import { Component, useMemo } from 'react'
import { prettyBytes, aggregateLockState, aggregateMetrics } from '@UtilsModule'
import { RESOURCE_NAMES, T, UNITS, STYLE_BUTTONS } from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Lock, NoLock, Trash, Cancel as CloseIcon } from 'iconoir-react'
import { VrTemplate } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedTemplates - Selected VR template
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedTemplates = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions,
}) => {
  const { showModal } = useModalsApi()

  const [refreshTemplate, { isFetching: isRefreshingTemplate }] =
    VrTemplateAPI.useLazyGetVrTemplateQuery()

  const [lock, { isLoading: isLocking }] =
    VmTemplateAPI.useLockTemplateMutation()
  const [unlock, { isLoading: isUnlocking }] =
    VmTemplateAPI.useUnlockTemplateMutation()

  const [remove, { isLoading: isRemoving }] =
    VmTemplateAPI.useRemoveTemplateMutation()

  const [changePermissions, { isLoading: isChangingPermissions }] =
    VmTemplateAPI.useChangeTemplatePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VmTemplateAPI.useChangeTemplateOwnershipMutation()

  const handleRefresh = async () =>
    await Promise.all(
      selectedTemplates.map(({ ID }) => refreshTemplate({ id: ID }))
    )

  const handleLock = async () => {
    await Promise.all(selectedTemplates.map(({ ID }) => lock({ id: ID })))
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await Promise.all(selectedTemplates.map(({ ID }) => unlock({ id: ID })))
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedTemplates.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedTemplates.map(({ ID }) =>
        changeOwnership({ id: ID, ...newOwnership })
      )
    )

    await handleRefresh()
  }

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.VRTemplates}`,
        description: (
          <ResourceActionConfirmation
            description={T['template.delete.confirmation']}
            resources={selectedTemplates}
            resourceType={T.VRTemplates}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(selectedTemplates.map(({ ID }) => remove({ id: ID })))
        handleClose()
      },
    })

  const isMutating =
    isLocking ||
    isUnlocking ||
    isRemoving ||
    isRefreshingTemplate ||
    isChangingOwnership ||
    isChangingPermissions

  const { allLocked, noneLocked } = aggregateLockState(selectedTemplates)

  const aggregatedMetrics = useMemo(() => {
    const templatesWithMetrics = selectedTemplates.map((template) => ({
      ...template,
      TEMPLATE: {
        ...template?.TEMPLATE,
        CPU: template?.TEMPLATE?.CPU ?? 1,
      },
    }))

    return aggregateMetrics(templatesWithMetrics, [
      'TEMPLATE.CPU',
      'TEMPLATE.MEMORY',
    ])
  }, [selectedTemplates])

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedTemplates?.length} ${T.VRTemplates} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <ButtonGroup
                  selected={allLocked ? ['lock'] : noneLocked ? ['unlock'] : []}
                  buttons={[
                    {
                      startIcon: <Lock width="16px" height="16px" />,
                      onClick: handleLock,
                      value: 'lock',
                      isDisabled: isMutating,
                      tooltip: T.Lock,
                    },
                    {
                      startIcon: <NoLock width="16px" height="16px" />,
                      onClick: handleUnlock,
                      value: 'unlock',
                      isDisabled: isMutating,
                      tooltip: T.Unlock,
                    },
                  ]}
                />

                <LabelButton
                  selectedRows={selectedTemplates}
                  resourceType={RESOURCE_NAMES.VROUTER_TEMPLATE}
                  isDisabled={isMutating}
                />
                <Button
                  type={STYLE_BUTTONS.TYPE.PRIMARY}
                  size="small"
                  startIcon={<Trash width={'16px'} height={'16px'} />}
                  onClick={handleOpenDeleteForm}
                  isDestructive
                  isDisabled={!noneLocked || isMutating}
                >
                  {T.DeleteSelected}
                </Button>

                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                  onClick={handleClose}
                  tooltip={T.Close}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [aggregatedMetrics?.['TEMPLATE.CPU'] || '-', T.CPU],
              [
                prettyBytes(aggregatedMetrics?.['TEMPLATE.MEMORY'], UNITS.MB),
                T.Memory,
              ],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: VrTemplate.Tabs.Aggregated,
            resourceId: VrTemplate.RID,
            tabProps: {
              selected: selectedTemplates,
              handleChangeOwnership,
              handleChangePermission,
              handleDeselect,
              handleSelect,
              isLocked: !noneLocked,
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
  selectedTemplates: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
