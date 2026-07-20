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

import { Box, Collapse, Tooltip } from '@mui/material'
import {
  Check as ApplyIcon,
  InfoEmpty as InfoIcon,
  Settings as OptimizeIcon,
  Trash as DeleteIcon,
} from 'iconoir-react'

import {
  AlertNotification,
  ResourceActionConfirmation,
  SubmitButton,
  Table,
} from '@ComponentsV2Module'
import { PLAN_STATE, T } from '@ConstantsModule'
import { DatastoreAPI, HostAPI, useModalsApi, VmAPI } from '@FeaturesModule'
import { timeFromSeconds } from '@ModelsModule'
import { StatusCircle } from '@modules/resources/Status'

const getPlanActions = (data = {}) =>
  [].concat(data?.ACTION || []).filter(Boolean)

const idToName = ({ ID, NAME }) => [ID, NAME]

const formatData = (apiData) => Object.fromEntries(apiData?.map(idToName) ?? [])

const formatResourceName = (nameMap, id) => {
  if (id === undefined || id === null || id === '') return '-'

  return nameMap?.[id] ?? id
}

const formatTimestamp = (timestamp) =>
  Number(timestamp) <= 0
    ? T.NotStartedYet
    : timeFromSeconds(Number(timestamp) * 1000).toRelative()

const getPlanState = (state) =>
  PLAN_STATE?.[state] ?? {
    name: state ?? '-',
    color: undefined,
  }

/**
 * @param {object} nameMap - Resource names by id
 * @returns {Array} OneDRS recommendation table columns
 */
const ActionEventColumns = (nameMap) => [
  {
    header: T.ID,
    id: 'id',
    accessorKey: 'ID',
  },
  {
    header: T.Operation,
    id: 'operation',
    accessorKey: 'OPERATION',
  },
  {
    header: T.VM,
    id: 'vm',
    accessorFn: ({ VM_ID }) => formatResourceName(nameMap?.vm, VM_ID),
  },
  {
    header: T.Host,
    id: 'host',
    accessorFn: ({ HOST_ID }) => formatResourceName(nameMap?.host, HOST_ID),
  },
  {
    header: T.Datastore,
    id: 'ds',
    accessorFn: ({ DS_ID }) => formatResourceName(nameMap?.ds, DS_ID),
  },
  {
    header: T.State,
    id: 'state',
    accessorKey: 'STATE',
    cell: ({ row }) => {
      const { color, name } = getPlanState(row?.original?.STATE)

      return (
        <Box className="drs-state-cell">
          <StatusCircle color={color} tooltip={name} />
          <span data-cy="plan-state">{name}</span>
        </Box>
      )
    },
  },
  {
    header: T.StartTime,
    id: 'timestamp',
    accessorFn: ({ TIMESTAMP }) => formatTimestamp(TIMESTAMP),
  },
]

/**
 * Timeline component that renders execution actions.
 *
 * @param {object} props - Component props
 * @param {object} props.data - Execution data
 * @param {boolean} props.isLoading - Loading indicator
 * @returns {Component} Timeline component that displays execution actions
 */
const ExecutionTimeline = ({ data = {}, isLoading, ...props }) => {
  const { showModal } = useModalsApi()

  const {
    isDisabled,
    isSubmitting,
    isApplyDisabled,
    isApplyHidden,
    handleApplyPlan,
    handleDeletePlan,
    handleOptimization,
  } = props

  const { data: vmData = [], isLoading: loadingVm } = VmAPI.useGetVmsQuery()
  const { data: dsData = [], isLoading: loadingDs } =
    DatastoreAPI.useGetDatastoresQuery()
  const { data: hostData = [], isLoading: loadingHost } =
    HostAPI.useGetHostsQuery()

  const nameMap = useMemo(
    () => ({
      vm: formatData(vmData),
      ds: formatData(dsData),
      host: formatData(hostData),
    }),
    [dsData, hostData, vmData]
  )

  const tableData = useMemo(() => getPlanActions(data), [data])
  const isInteractable = !!tableData?.length
  const loadingColumns = loadingVm || loadingDs || loadingHost
  const columns = useMemo(() => ActionEventColumns(nameMap), [nameMap])
  const recommendations = useMemo(
    () => (loadingColumns ? [] : tableData),
    [loadingColumns, tableData]
  )

  const handleOpenApplyForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Apply,
        description: (
          <ResourceActionConfirmation
            description={T.DoYouWantApplyOp}
            resourceType={T.Drs}
          />
        ),
        confirmLabel: T.Apply,
      },
      onSubmit: handleApplyPlan,
    })

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Delete,
        description: (
          <ResourceActionConfirmation
            description={T.DoYouWantDeleteOp}
            resourceType={T.Drs}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: handleDeletePlan,
    })

  return (
    <Box className="drs-recommendations">
      <Box className="drs-recommendations-header">
        <Box component="h3" className="drs-title">
          {T.DrsRecommendations}
        </Box>
        <Box className="drs-recommendation-actions">
          {!isApplyHidden && (
            <SubmitButton
              data-cy="apply-plan"
              label={T.ApplyPlan}
              endIcon={ApplyIcon}
              isDisabled={isDisabled || isApplyDisabled || !isInteractable}
              onClick={handleOpenApplyForm}
            />
          )}
          <SubmitButton
            isSubmitting={isSubmitting}
            endIcon={OptimizeIcon}
            isDisabled={isDisabled || isApplyDisabled}
            label={T.Optimize}
            onClick={handleOptimization}
          />
          <SubmitButton
            data-cy="delete-plan"
            label={T.DeletePlan}
            endIcon={DeleteIcon}
            type="secondary"
            isDestructive
            isDisabled={isDisabled || isApplyDisabled || !isInteractable}
            onClick={handleOpenDeleteForm}
          />
        </Box>
      </Box>
      <Collapse in={isApplyDisabled}>
        <Box
          className="drs-automation-alert"
          sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertNotification
            type="primary"
            status="warning"
            description={T.AutomationEnabled}
            isDismissible={false}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <Tooltip title={T.AutomationFull} arrow>
            <InfoIcon className="drs-alert-info-icon" />
          </Tooltip>
        </Box>
      </Collapse>
      <Box className="drs-recommendations-table">
        <Table
          columns={columns}
          data={recommendations}
          isRowsSelectable={false}
          isLoading={isLoading || loadingColumns}
        />
      </Box>
    </Box>
  )
}

ExecutionTimeline.propTypes = {
  data: PropTypes.object,
  isLoading: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  isApplyDisabled: PropTypes.bool,
  isApplyHidden: PropTypes.bool,
  handleApplyPlan: PropTypes.func,
  handleDeletePlan: PropTypes.func,
  handleOptimization: PropTypes.func,
}

export default ExecutionTimeline
