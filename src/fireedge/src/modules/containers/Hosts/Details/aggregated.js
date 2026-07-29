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
  SummarySlot,
  StatusTag,
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'
import { getHostState } from '@ModelsModule'
import { ChangeClusterForm, Host } from '@ResourcesModule'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Cancel,
  CloudError,
  Network,
  Trash,
  OnTag,
  OffTag,
} from 'iconoir-react'
import { HOST_ACTIONS, RESOURCE_NAMES, STATES, T } from '@ConstantsModule'
import { createActions, getTotalOfResources, prettyBytes } from '@UtilsModule'
import { ClusterAPI, HostAPI, useModalsApi, useViews } from '@FeaturesModule'

const getCommonValue = (resources, getter) => {
  const [first] = [].concat(resources)
  const firstValue = getter(first)

  return resources.every((resource) => getter(resource) === firstValue)
    ? firstValue
    : '-'
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object[]} root0.selectedHosts - Selected Hosts
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedHosts = [],
  handleClose,
  handleSelect,
  handleDeselect,
}) => {
  const { palette } = useTheme()
  const { showModal } = useModalsApi()
  const { getResourceView } = useViews()

  const [refreshHost, { isFetching: isRefreshingHost }] =
    HostAPI.useLazyGetHostQuery()
  const [enableHost, { isLoading: isEnabling }] =
    HostAPI.useEnableHostMutation()
  const [disableHost, { isLoading: isDisabling }] =
    HostAPI.useDisableHostMutation()
  const [offlineHost, { isLoading: isOfflining }] =
    HostAPI.useOfflineHostMutation()
  const [removeHost, { isLoading: isRemoving }] =
    HostAPI.useRemoveHostMutation()
  const [changeCluster, { isLoading: isChangingCluster }] =
    ClusterAPI.useAddHostToClusterMutation()

  const isActionsDisabled =
    selectedHosts?.length === 0 ||
    isRefreshingHost ||
    isEnabling ||
    isDisabling ||
    isOfflining ||
    isRemoving ||
    isChangingCluster

  const handleRefresh = async () =>
    await Promise.all(selectedHosts.map(({ ID }) => refreshHost({ id: ID })))

  const handleOpenChangeClusterForm = () =>
    showModal({
      name: T.SelectCluster,
      dialogProps: {
        title: T.SelectCluster,
        dataCy: 'modal-select-cluster',
        validateOn: 'onBlur',
      },
      onSubmit: async (formData) => {
        const clusterId = formData?.cluster

        await Promise.all(
          selectedHosts.map(({ ID }) =>
            changeCluster({ id: clusterId, host: ID })
          )
        )
        await handleRefresh()
      },
      form: ChangeClusterForm(),
    })

  const handleConfirmAction = ({ title, description, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description: (
          <ResourceActionConfirmation
            description={description}
            resources={selectedHosts}
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
      onSubmit: async () => {
        await Promise.all(selectedHosts.map(({ ID }) => enableHost(ID)))
        await handleRefresh()
      },
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: T.Disable,
      description: T['resource.disable.confirmation'],
      onSubmit: async () => {
        await Promise.all(selectedHosts.map(({ ID }) => disableHost(ID)))
        await handleRefresh()
      },
    })

  const handleOffline = () =>
    handleConfirmAction({
      title: T.Offline,
      description: T['resource.offline.confirmation'],
      onSubmit: async () => {
        await Promise.all(selectedHosts.map(({ ID }) => offlineHost(ID)))
        await handleRefresh()
      },
    })

  const handleDelete = () =>
    handleConfirmAction({
      title: T.Delete,
      description: T['resource.delete.confirmation'],
      onSubmit: async () => {
        await Promise.all(selectedHosts.map(({ ID }) => removeHost({ id: ID })))
        handleClose()
      },
    })

  const viewActions = getResourceView(RESOURCE_NAMES.HOST)?.actions

  const { allEnabled, allDisabled } = useMemo(
    () =>
      selectedHosts.reduce(
        (acc, host) => {
          const { name: stateName } = getHostState(host) ?? {}

          return {
            allEnabled:
              acc.allEnabled &&
              stateName !== STATES.OFFLINE &&
              stateName !== STATES.DISABLED,
            allDisabled: acc.allDisabled && stateName === STATES.DISABLED,
          }
        },
        { allEnabled: true, allDisabled: true }
      ),
    [selectedHosts]
  )

  const statusSelection = [
    allEnabled && HOST_ACTIONS.ENABLE,
    allDisabled && HOST_ACTIONS.DISABLE,
  ].filter(Boolean)

  const statusButtons = createActions({
    filters: viewActions,
    actions: [
      {
        accessor: HOST_ACTIONS.ENABLE,
        startIcon: <OnTag width="16px" height="16px" />,
        onClick: handleEnable,
        value: HOST_ACTIONS.ENABLE,
        isDisabled: isActionsDisabled,
      },
      {
        accessor: HOST_ACTIONS.DISABLE,
        startIcon: <OffTag width="16px" height="16px" />,
        onClick: handleDisable,
        value: HOST_ACTIONS.DISABLE,
        isDisabled: isActionsDisabled,
      },
    ],
  })

  const toggleOptions = [
    createActions({
      filters: viewActions,
      actions: [
        {
          accessor: HOST_ACTIONS.OFFLINE,
          startIcon: <CloudError width="16px" height="16px" />,
          onClick: handleOffline,
          value: HOST_ACTIONS.OFFLINE,
          tooltip: T.Offline,
          isDisabled: isActionsDisabled,
        },
        {
          accessor: HOST_ACTIONS.CHANGE_CLUSTER,
          startIcon: <Network width="16px" height="16px" />,
          onClick: handleOpenChangeClusterForm,
          value: HOST_ACTIONS.CHANGE_CLUSTER,
          tooltip: T.SelectCluster,
          isDisabled: isActionsDisabled,
        },
      ],
    }),
    [
      {
        ...getLabelMenuButtonProps({
          selectedRows: selectedHosts,
          resourceType: RESOURCE_NAMES.HOST,
          isDisabled: isActionsDisabled,
        }),
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

  const summary = useMemo(() => {
    const totals = selectedHosts.reduce(
      (acc, host) => {
        const { CPU_USAGE, MAX_CPU, MEM_USAGE, MAX_MEM, RUNNING_VMS } =
          host?.HOST_SHARE ?? {}

        return {
          runningVms: acc.runningVms + (+RUNNING_VMS || 0),
          totalVms: acc.totalVms + getTotalOfResources(host?.VMS),
          cpuUsage: acc.cpuUsage + (+CPU_USAGE || 0),
          maxCpu: acc.maxCpu + (+MAX_CPU || 0),
          memUsage: acc.memUsage + (+MEM_USAGE || 0),
          maxMem: acc.maxMem + (+MAX_MEM || 0),
        }
      },
      {
        runningVms: 0,
        totalVms: 0,
        cpuUsage: 0,
        maxCpu: 0,
        memUsage: 0,
        maxMem: 0,
      }
    )

    const cpuPercent =
      totals.maxCpu > 0
        ? Math.round((totals.cpuUsage * 100) / totals.maxCpu)
        : '--'
    const memPercent =
      totals.maxMem > 0
        ? Math.round((totals.memUsage * 100) / totals.maxMem)
        : '--'
    const isMemUsageNegative = totals.memUsage < 0

    return {
      state: getCommonValue(
        selectedHosts,
        (host) => getHostState(host)?.name ?? '-'
      ),
      stateColor: getCommonValue(
        selectedHosts,
        (host) => getHostState(host)?.color ?? 'default'
      ),
      cluster: getCommonValue(selectedHosts, (host) => host?.CLUSTER ?? '-'),
      imMad: getCommonValue(selectedHosts, (host) => host?.IM_MAD ?? '-'),
      vmMad: getCommonValue(selectedHosts, (host) => host?.VM_MAD ?? '-'),
      runningVms: totals.runningVms,
      totalVms: totals.totalVms,
      cpuLabel: `${totals.cpuUsage} / ${
        totals.maxCpu > 0 ? totals.maxCpu : '-'
      } (${cpuPercent}%)`,
      memLabel: `${isMemUsageNegative ? '-' : ''}${prettyBytes(
        Math.abs(totals.memUsage)
      )} / ${
        totals.maxMem > 0 ? prettyBytes(totals.maxMem) : '-'
      } (${memPercent}%)`,
    }
  }, [selectedHosts])

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedHosts?.length} ${T.Hosts} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                {statusButtons.length > 0 && (
                  <ButtonGroup
                    selected={statusSelection}
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
                  statusColor={
                    summary.stateColor === '-' ? 'default' : summary.stateColor
                  }
                  statusName={summary.state}
                />,
                T.State,
              ],
              [summary.runningVms, T.RunningVMs],
              [summary.totalVms, T.TotalVMs],
              [summary.cpuLabel, T.CPU],
              [summary.memLabel, T.Memory],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: Host.Tabs.Aggregated,
            resourceId: Host.RID,
            tabProps: {
              selected: selectedHosts,
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
  selectedHosts: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
}
