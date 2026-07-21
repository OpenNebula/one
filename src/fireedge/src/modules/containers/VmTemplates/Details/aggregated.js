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
  Tooltip,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'
import { useModalsApi, VmTemplateAPI } from '@FeaturesModule'
import { Component, useMemo } from 'react'
import { prettyBytes, aggregateLockState, aggregateMetrics } from '@UtilsModule'
import { RESOURCE_NAMES, T, UNITS, STYLE_BUTTONS } from '@ConstantsModule'
import {
  getVmTemplateImageCount,
  getVmTemplateNetworkCount,
} from '@ModelsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import {
  Lock,
  NoLock,
  KeyframesCouple as CloneIcon,
  Trash,
  Cancel as CloseIcon,
} from 'iconoir-react'
import { VmTemplate } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedTemplates - Selected VM template
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
    VmTemplateAPI.useLazyGetTemplateQuery()

  const [lock, { isLoading: isLocking }] =
    VmTemplateAPI.useLockTemplateMutation()
  const [unlock, { isLoading: isUnlocking }] =
    VmTemplateAPI.useUnlockTemplateMutation()

  const [remove, { isLoading: isRemoving }] =
    VmTemplateAPI.useRemoveTemplateMutation()
  const [clone, { isLoading: isCloning }] =
    VmTemplateAPI.useCloneTemplateMutation()

  const [changePermissions, { isLoading: isChangingPermissions }] =
    VmTemplateAPI.useChangeTemplatePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VmTemplateAPI.useChangeTemplateOwnershipMutation()

  const handleRefresh = async () =>
    await Promise.all(
      selectedTemplates.map(({ ID }) => refreshTemplate({ id: ID }))
    )

  const handleLock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Lock,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedTemplates}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Lock,
      },
      onSubmit: async () => {
        await Promise.all(selectedTemplates.map(({ ID }) => lock({ id: ID })))
        await handleRefresh()
      },
    })

  const handleUnlock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Unlock,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedTemplates}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Unlock,
      },
      onSubmit: async () => {
        await Promise.all(selectedTemplates.map(({ ID }) => unlock({ id: ID })))
        await handleRefresh()
      },
    })

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

  const handleOpenCloneForm = () => {
    const isMultiple = selectedTemplates.length > 1
    const { NAME } = selectedTemplates?.[0] ?? {}

    return showModal({
      name: T.Clone,
      dialogProps: {
        title: isMultiple ? T.CloneSeveralTemplates : T.CloneTemplate,
        dataCy: 'modal-clone',
        description: (
          <ResourceActionConfirmation
            description={T['resource.clone.confirmation']}
            resources={selectedTemplates}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Clone,
      },
      form: VmTemplate.Forms.CloneForm({
        stepProps: { isMultiple },
        initialValues: { name: `Copy of ${NAME}` },
      }),
      onSubmit: async ({ prefix, name, image } = {}) => {
        const templates = selectedTemplates.map(({ ID, NAME: templateName }) =>
          // overwrite all names with prefix+NAME
          ({
            id: ID,
            name: prefix ? `${prefix} ${templateName}` : name,
            image,
          })
        )

        await Promise.all(templates.map(clone))
      },
    })
  }

  const handleOpenDeleteForm = () =>
    showModal({
      dialogProps: {
        title: `${T.Delete} ${T.VMTemplates}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedTemplates}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      form: VmTemplate.Forms.DeleteForm(),
      onSubmit: async ({ image } = {}) => {
        await Promise.all(
          selectedTemplates.map(({ ID }) => remove({ id: ID, image }))
        )
        handleClose()
      },
    })

  const isMutating =
    isLocking ||
    isUnlocking ||
    isCloning ||
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
        NETWORKS: getVmTemplateNetworkCount(template),
        IMAGES: getVmTemplateImageCount(template),
      },
    }))

    const metrics = aggregateMetrics(templatesWithMetrics, [
      'TEMPLATE.CPU',
      'TEMPLATE.MEMORY',
      'TEMPLATE.NETWORKS',
      'TEMPLATE.IMAGES',
    ])

    return {
      cpu: metrics['TEMPLATE.CPU'],
      memory: prettyBytes(metrics?.['TEMPLATE.MEMORY'] ?? 0, UNITS.MB),
      networks: metrics['TEMPLATE.NETWORKS'],
      images: metrics['TEMPLATE.IMAGES'],
    }
  }, [selectedTemplates])

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedTemplates?.length} ${T.VMTemplates} ${T.Selected}`,
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
                      tooltip: T.Lock,
                      isDisabled: isMutating,
                    },
                    {
                      startIcon: <NoLock width="16px" height="16px" />,
                      onClick: handleUnlock,
                      value: 'unlock',
                      tooltip: T.Unlock,
                      isDisabled: isMutating,
                    },
                  ]}
                />

                <Tooltip title={T.Clone}>
                  <span>
                    <Button
                      type={STYLE_BUTTONS.TYPE.SECONDARY}
                      size="small"
                      startIcon={<CloneIcon width={'16px'} height={'16px'} />}
                      onClick={handleOpenCloneForm}
                      isDisabled={!noneLocked || isMutating}
                    >
                      {T.Clone}
                    </Button>
                  </span>
                </Tooltip>

                <LabelButton
                  selectedRows={selectedTemplates}
                  resourceType={RESOURCE_NAMES.VM_TEMPLATE}
                  isDisabled={isMutating}
                />
                <Tooltip title={T.DeleteSelected}>
                  <span>
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
                  </span>
                </Tooltip>

                <Tooltip title={T.Close}>
                  <span>
                    <Button
                      type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                      size="small"
                      iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                      onClick={handleClose}
                    />
                  </span>
                </Tooltip>
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [aggregatedMetrics.cpu, T.CPU],
              [aggregatedMetrics.memory, T.Memory],
              [aggregatedMetrics.images, T.Images],
              [aggregatedMetrics.networks, T.Networks],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: VmTemplate.Tabs.Aggregated,
            resourceId: VmTemplate.RID,
            tabProps: {
              selected: selectedTemplates,
              handleChangePermission,
              handleChangeOwnership,
              handleSelect,
              handleDeselect,
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
