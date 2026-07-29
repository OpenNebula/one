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
  ButtonGroup,
  DetailsDrawer,
  getLabelMenuButtonProps,
  InfoSlot,
  ResourceActionConfirmation,
  StatusTag,
  SummarySlot,
  TabSlot,
  Tag,
  ToggleGroup,
} from '@ComponentsV2Module'
import { getHostState, getLabelTags } from '@ModelsModule'
import { Box, useTheme } from '@mui/material'
import { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Cancel,
  CloudError,
  Network,
  RefreshDouble,
  Trash,
  OnTag,
  OffTag,
  SafeArrowRight,
} from 'iconoir-react'
import { HOST_ACTIONS, RESOURCE_NAMES, STATES, T } from '@ConstantsModule'
import { createActions, formatError } from '@UtilsModule'
import {
  ClusterAPI,
  HostAPI,
  VmAPI,
  useGeneralApi,
  useModalsApi,
  useViews,
} from '@FeaturesModule'
import { Cluster, Host } from '@ResourcesModule'

const clusterDialogSizeProps = {
  dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
  dialogMaxWidth: 'calc(100vw - 32px)',
  dialogMaxHeight: 'calc(100vh - 64px)',
  dialogPaperOverflow: 'visible',
  dialogContentMaxHeight: '70vh',
  dialogContentOverflowY: 'auto',
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedHost - Selected Host
 * @param {Function} root0.handleClose - Handle close
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedHost = {},
  handleClose,
}) => {
  // Get hooks
  const { palette } = useTheme()
  const { showModal } = useModalsApi()
  const { enqueueError, enqueueInfo } = useGeneralApi()
  const { getResourceView } = useViews()

  const {
    data: refreshedHost = {},
    isFetching,
    refetch: refreshHost,
  } = HostAPI.useGetHostQuery(
    { id: selectedHost?.ID },
    { skip: selectedHost?.ID === undefined }
  )

  const [rename, { isLoading: isRenaming }] = HostAPI.useRenameHostMutation()
  const [enableHost, { isLoading: isEnabling }] =
    HostAPI.useEnableHostMutation()
  const [disableHost, { isLoading: isDisabling }] =
    HostAPI.useDisableHostMutation()
  const [offlineHost, { isLoading: isOfflining }] =
    HostAPI.useOfflineHostMutation()
  const [flushHost, { isLoading: isFlushing }] = HostAPI.useFlushMutation()
  const [removeHost, { isLoading: isRemoving }] =
    HostAPI.useRemoveHostMutation()
  const [changeCluster, { isLoading: isChangingCluster }] =
    ClusterAPI.useAddHostToClusterMutation()

  const host =
    String(refreshedHost?.ID) === String(selectedHost?.ID)
      ? refreshedHost
      : selectedHost
  const { CLUSTER, ID, IM_MAD, VM_MAD } = host
  const { name: stateName, color: stateColor } = getHostState(host) ?? {}

  // Information for tabs
  const {
    data: vms = [],
    isFetching: isFetchingVms,
    refetch: refreshVms,
  } = VmAPI.useGetVmsPaginatedQuery({ extended: 0, state: -2 })

  const {
    data: monitoringData = {},
    isFetching: isFetchingMonitoring,
    refetch: refreshMonitoring,
  } = HostAPI.useGetHostMonitoringQuery({ id: ID }, { skip: ID === undefined })
  const { MONITORING_DATA: { MONITORING: monitoring = [] } = {} } =
    monitoringData

  const isActionsDisabled =
    ID === undefined ||
    isFetching ||
    isFetchingVms ||
    isEnabling ||
    isDisabling ||
    isOfflining ||
    isFlushing ||
    isRemoving ||
    isChangingCluster ||
    isFetchingMonitoring

  const handleRefresh = () => {
    if (ID === undefined) return

    refreshHost()
    refreshVms()
    refreshMonitoring()
  }

  const refreshCurrentHost = async () =>
    ID !== undefined && (await refreshHost())

  const handleRename = async (newName) => {
    await rename({ id: selectedHost?.ID, name: newName })
  }

  const handleOpenChangeClusterForm = () =>
    showModal({
      name: T.SelectCluster,
      dialogProps: {
        title: T.SelectCluster,
        dataCy: 'modal-select-cluster',
        validateOn: 'onBlur',
        ...clusterDialogSizeProps,
      },
      onSubmit: async (formData) => {
        await changeCluster({ id: formData?.cluster, host: ID })
        await refreshCurrentHost()
      },
      form: Cluster.Forms.ChangeClusterForm(),
    })

  const handleConfirmAction = ({ title, description, dataCy, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        dataCy,
        description: (
          <ResourceActionConfirmation
            description={description}
            resources={host}
            resourceType={T.Hosts}
          />
        ),
        confirmLabel: `${title}`.startsWith(T.Delete) ? T.Delete : title,
        ...(`${title}`.startsWith(T.Delete) && {
          confirmButtonProps: {
            isDestructive: true,
          },
        }),
      },
      onSubmit,
    })

  const handleEnable = () =>
    handleConfirmAction({
      title: T.Enable,
      description: T['resource.enable.confirmation'],
      dataCy: `modal_${HOST_ACTIONS.ENABLE}`,
      onSubmit: async () => {
        await enableHost(ID)
        await refreshCurrentHost()
      },
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: T.Disable,
      description: T['resource.disable.confirmation'],
      dataCy: `modal_${HOST_ACTIONS.DISABLE}`,
      onSubmit: async () => {
        await disableHost(ID)
        await refreshCurrentHost()
      },
    })

  const handleOffline = () =>
    handleConfirmAction({
      title: T.Offline,
      description: T['resource.offline.confirmation'],
      dataCy: `modal_${HOST_ACTIONS.OFFLINE}`,
      onSubmit: async () => {
        await offlineHost(ID)
        await refreshCurrentHost()
      },
    })

  const handleFlush = () =>
    handleConfirmAction({
      title: T.Flush,
      description: T['resource.flush.confirmation'],
      dataCy: `modal_${HOST_ACTIONS.FLUSH}`,
      onSubmit: async () => {
        const result = await flushHost(ID)
        const hasData =
          result?.data && Object.keys(result?.data ?? {}).length > 0

        if (hasData) {
          enqueueInfo(T.InfoHostFlush, [result?.data?.HOST?.ID ?? T.NotFound])
        } else {
          enqueueError(
            formatError(result?.error?.data?.data, { fallback: T.Error })
          )
        }

        await refreshCurrentHost()
      },
    })

  const handleDelete = () =>
    handleConfirmAction({
      title: T.Delete,
      description: T['resource.delete.confirmation'],
      dataCy: 'modal-host-delete',
      onSubmit: async () => {
        await removeHost({ id: ID })
        handleClose()
      },
    })

  const hostIsDisabled = stateName === STATES.DISABLED
  const hostIsOffline = stateName === STATES.OFFLINE

  // Get actions that should be displayed according to configuration
  const viewActions = getResourceView(RESOURCE_NAMES.HOST)?.actions

  // Enable and disable
  const statusButtons = createActions({
    filters: viewActions,
    actions: [
      {
        accessor: HOST_ACTIONS.ENABLE,
        startIcon: <OnTag width="16px" height="16px" />,
        onClick: handleEnable,
        value: HOST_ACTIONS.ENABLE,
        dataCy: `action-host_${HOST_ACTIONS.ENABLE}`,
        isDisabled: isActionsDisabled,
      },
      {
        accessor: HOST_ACTIONS.DISABLE,
        startIcon: <OffTag width="16px" height="16px" />,
        onClick: handleDisable,
        value: HOST_ACTIONS.DISABLE,
        dataCy: `action-host_${HOST_ACTIONS.DISABLE}`,
        isDisabled: isActionsDisabled,
      },
    ],
  })

  // Rest of actions
  const toggleOptions = [
    [
      ...createActions({
        filters: viewActions,
        actions: [
          {
            accessor: HOST_ACTIONS.OFFLINE,
            startIcon: <CloudError width="16px" height="16px" />,
            onClick: handleOffline,
            value: HOST_ACTIONS.OFFLINE,
            'data-cy': `action-host_${HOST_ACTIONS.OFFLINE}`,
            tooltip: T.Offline,
            isDisabled: isActionsDisabled,
          },
          {
            accessor: HOST_ACTIONS.FLUSH,
            startIcon: <SafeArrowRight width="16px" height="16px" />,
            onClick: handleFlush,
            value: HOST_ACTIONS.FLUSH,
            'data-cy': `action-host_${HOST_ACTIONS.FLUSH}`,
            tooltip: T.Flush,
            isDisabled: isActionsDisabled,
          },
          {
            accessor: HOST_ACTIONS.CHANGE_CLUSTER,
            startIcon: <Network width="16px" height="16px" />,
            onClick: handleOpenChangeClusterForm,
            value: HOST_ACTIONS.CHANGE_CLUSTER,
            'data-cy': 'action-host-change_cluster',
            tooltip: T.SelectCluster,
            isDisabled: isActionsDisabled,
          },
        ],
      }),
    ],
    [
      {
        ...getLabelMenuButtonProps({
          selectedRows: [host],
          resourceType: RESOURCE_NAMES.HOST,
          isDisabled: isActionsDisabled,
        }),
      },
      {
        startIcon: <RefreshDouble width="16px" height="16px" />,
        onClick: handleRefresh,
        value: 'refresh',
        tooltip: T.Refresh,
        isDisabled: isActionsDisabled,
      },
    ],
    [
      ...createActions({
        filters: viewActions,
        actions: [
          {
            accessor: HOST_ACTIONS.DELETE,
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
            onClick: handleDelete,
            value: HOST_ACTIONS.DELETE,
            'data-cy': 'action-host-delete',
            tooltip: T.Delete,
            isDestructive: true,
            isDisabled: isActionsDisabled,
          },
        ],
      }),
      {
        startIcon: <Cancel width="16px" height="16px" />,
        onClick: handleClose,
        value: 'close',
        tooltip: T.Close,
      },
    ].filter(Boolean),
  ].filter(({ length }) => length > 0)

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
            title: host?.NAME,
            id: ID,
            dataCy: 'host',
            tags: getLabelTags(host?.LABELS),
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
                tabsAvailable
              >
                {statusButtons.length > 0 && (
                  <ButtonGroup
                    selected={
                      !hostIsOffline && !hostIsDisabled
                        ? [HOST_ACTIONS.ENABLE]
                        : !hostIsOffline && hostIsDisabled
                        ? [HOST_ACTIONS.DISABLE]
                        : []
                    }
                    buttons={statusButtons}
                  />
                )}
                <ToggleGroup size="medium" options={toggleOptions} />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [
                <StatusTag
                  key="host-state"
                  statusName={stateName ?? '-'}
                  statusColor={stateColor}
                />,
                T.State,
              ],
              [CLUSTER ?? '-', T.Cluster],
              [
                <Tag key="im-mad" title={IM_MAD ?? '-'} status="default" />,
                T.IM_MAD,
              ],
              [
                <Tag key="vm-mad" title={VM_MAD ?? '-'} status="default" />,
                T.VM_MAD,
              ],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Host.Tabs.Single,
            resourceId: Host.RID,
            tabProps: {
              selected: host,
              host,
              vms,
              monitoring,
            },
          },
        ],
      ]}
    />
  )
}

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedHost: PropTypes.object,
  handleClose: PropTypes.func,
}
