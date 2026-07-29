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
  getLabelMenuButtonProps,
  InfoSlot,
  ResourceActionConfirmation,
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'

import { PATH, RESOURCE_NAMES, T } from '@ConstantsModule'
import { VdcAPI, useModalsApi } from '@FeaturesModule'
import {
  getLabelTags,
  getVdcClustersCount,
  getVdcDatastoresCount,
  getVdcGroupsCount,
  getVdcHostsCount,
  getVdcVnetsCount,
} from '@ModelsModule'
import { Vdc } from '@ResourcesModule'
import { Box, useTheme } from '@mui/material'
import { Cancel, Edit, RefreshDouble, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { useHistory } from 'react-router'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedVdc - Selected VDC
 * @param {Function} root0.handleClose - Handle close
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedVdc = {},
  handleClose,
}) => {
  const { palette } = useTheme()
  const history = useHistory()
  const { showModal } = useModalsApi()
  const [refreshVdc, { data: refreshedVdc = {}, isFetching }] =
    VdcAPI.useLazyGetVDCQuery()
  const [rename, { isLoading: isRenaming }] = VdcAPI.useRenameVDCMutation()
  const [remove, { isLoading: isRemoving }] = VdcAPI.useRemoveVDCMutation()

  const vdc =
    String(refreshedVdc?.ID) === String(selectedVdc?.ID)
      ? refreshedVdc
      : selectedVdc
  const { ID, NAME } = vdc
  const vdcId = String(ID)

  const handleRefresh = () => ID !== undefined && refreshVdc({ id: ID })

  const handleUpdate = () => {
    history.push(PATH.SYSTEM.VDCS.CREATE, vdc)
  }

  const handleRename = async (newName) => {
    await rename({ id: selectedVdc?.ID, name: newName })
  }

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: [T.Delete, T.VDC].filter(Boolean).join(' '),
        dataCy: 'modal-delete',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedVdc}
            resourceType={T.VDCs}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: ID })
        handleClose()
      },
    })

  const isActionsDisabled = isFetching || isRenaming || isRemoving

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: true,
            onTitleChange: handleRename,
            isTitleEditDisabled: isRenaming,
            title: NAME,
            id: ID,
            dataCy: 'vdc-info',
            tags: getLabelTags(vdc?.LABELS),
            labels: [
              [T.Groups, getVdcGroupsCount(vdc)],
              [T.Clusters, getVdcClustersCount(vdc)],
              [T.Hosts, getVdcHostsCount(vdc)],
              [T.Datastores, getVdcDatastoresCount(vdc)],
              [T.Vnets, getVdcVnetsCount(vdc)],
            ],
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [vdc],
                          resourceType: RESOURCE_NAMES.VDC,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleUpdate,
                        value: 'update',
                        'data-cy': 'action-update_dialog',
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        isDisabled: isActionsDisabled,
                      },
                    ],
                    [
                      {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color: isActionsDisabled
                                ? palette.text.disabled
                                : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleOpenDeleteForm,
                        value: 'delete',
                        'data-cy': 'action-vdc_delete',
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                      },
                    ],
                  ]}
                />
              </Box>
            ),
          },
        ],
        [
          TabSlot,
          {
            tabs: Vdc.Tabs.Single,
            resourceId: Vdc.RID,
            tabProps: {
              vdcId,
              selected: vdc,
            },
          },
          { flex: '1 1 0', minHeight: 0 },
        ],
      ]}
    />
  )
}

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVdc: PropTypes.object,
  handleClose: PropTypes.func,
}
