/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { timeFromSeconds } from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import { SubmitButton } from '@modules/components/FormControl'
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'

import HistoryRecordCard from '@modules/components/Tabs/Vm/History/HistoryRecord'

import { StatusCircle } from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'

import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { DatastoreAPI, HostAPI, VmAPI } from '@FeaturesModule'

import { Column } from 'opennebula-react-table'
import {
  Alert,
  Collapse,
  Tooltip,
  Box,
  Typography,
  Toolbar,
  AppBar,
} from '@mui/material'

import {
  Trash as DeleteIcon,
  Settings as OptimizeIcon,
  Check as ApplyIcon,
  InfoEmpty as InfoIcon,
  Cancel as CloseIcon,
} from 'iconoir-react'

import { T, PLAN_STATE } from '@ConstantsModule'

/** @type {Column[]} VM Template columns */
const ActionEventColumns = (nameMap) => [
  {
    Header: T.ID,
    header: T.ID,
    id: 'id',
    accessor: 'ID',
    sortType: 'number',
  },
  {
    Header: T.Operation,
    header: T.Operation,
    id: 'operation',
    accessor: 'OPERATION',
  },
  {
    Header: T.VM,
    header: T.VM,
    id: 'vm',
    accessor: ({ VM_ID }) => nameMap?.vm?.[VM_ID],
    sortType: 'number',
  },
  {
    Header: T.Host,
    header: T.Host,
    id: 'host',
    accessor: ({ HOST_ID }) => nameMap?.host?.[HOST_ID],
    sortType: 'number',
  },
  {
    Header: T.Datastore,
    header: T.Datastore,
    id: 'ds',
    accessor: ({ DS_ID }) => nameMap?.ds?.[DS_ID],
    sortType: 'number',
  },
  {
    Header: T.State,
    header: T.State,
    id: 'state',
    accessor: ({ STATE }) => {
      const { color, name } = PLAN_STATE?.[STATE]

      return (
        <Box display="flex" flexDirection="row" gap={1} alignItems="center">
          <StatusCircle color={color} tooltip={name} />
          <span data-cy="plan-state">{name}</span>
        </Box>
      )
    },
  },

  {
    Header: T.StartTime,
    header: T.StartTime,
    id: 'timestamp',
    sortType: 'number',
    accessor: ({ TIMESTAMP }) =>
      TIMESTAMP <= 0
        ? T.NotStartedYet
        : timeFromSeconds(TIMESTAMP * 1000).toFormat('MMM dd HH:mm:ss'),
  },
]

/**
 * Timeline component that renders execution actions.
 *
 * @param {object} props - Component props
 * @param {object} props.data - Execution data
 * @param {Function} props.isLoading - Loading indicator
 * @returns {Component} Timeline component that displays execution actions
 */
const ExecutionTimeline = ({ data, isLoading, ...props }) => {
  const {
    isDisabled,
    isSubmitting,
    isDrsEnabled,
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

  const idToName = ({ ID, NAME }) => [ID, NAME]

  const formatData = (apiData) =>
    Object.fromEntries(apiData?.map(idToName) ?? [])

  const nameMap = useMemo(
    () => ({
      vm: formatData(vmData),
      ds: formatData(dsData),
      host: formatData(hostData),
    }),
    [vmData, dsData, hostData]
  )

  const tableData = [].concat(data?.ACTION || [])
  const isInteractable = !!tableData?.length

  const genColumns = useMemo(() => ActionEventColumns(nameMap), [nameMap])
  const loadingColumns = loadingVm || loadingDs || loadingHost

  const columns = useMemo(
    () =>
      createColumns({
        columns: genColumns,
      }),
    []
  )

  const { component, header } = WrapperRow(HistoryRecordCard, undefined, 'list')

  return (
    <Box>
      <AppBar
        position="static"
        sx={{ marginBottom: '0.5rem', borderRadius: 1 }}
        enableColorOnDark
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingX: 2,
          }}
        >
          <Typography variant="h6">{T.DrsRecommendations}</Typography>

          <Box sx={{ display: 'flex', gap: '1em' }}>
            {!isApplyHidden && (
              <ButtonToTriggerForm
                buttonProps={{
                  'data-cy': 'apply-plan',
                  label: T.ApplyPlan,
                  disabled:
                    !isDrsEnabled ||
                    isSubmitting ||
                    isApplyDisabled ||
                    !isInteractable,

                  endIcon: <ApplyIcon />,
                  sx: {
                    flex: '1',
                  },
                }}
                options={[
                  {
                    isConfirmDialog: true,
                    dialogProps: {
                      title: T.Apply,
                      children: <p>{Tr(T.DoYouWantApplyOp)}</p>,
                    },
                    onSubmit: handleApplyPlan,
                  },
                ]}
              />
            )}
            <SubmitButton
              isSubmitting={isSubmitting}
              endIcon={<OptimizeIcon />}
              disabled={isDisabled || isApplyDisabled}
              label={T.Optimize}
              onClick={handleOptimization}
              sx={{
                flex: '1',
              }}
            />

            <ButtonToTriggerForm
              buttonProps={{
                endIcon: <DeleteIcon />,
                'data-cy': 'delete-plan',
                label: T.DeletePlan,
                disabled:
                  !isDrsEnabled ||
                  isSubmitting ||
                  isApplyDisabled ||
                  !isInteractable,
                sx: {
                  flex: '1',

                  backgroundColor: 'white',
                  color: 'black',
                },
              }}
              options={[
                {
                  isConfirmDialog: true,
                  dialogProps: {
                    title: T.Delete,
                    children: <p>{Tr(T.DoYouWantDeleteOp)}</p>,
                  },
                  onSubmit: handleDeletePlan,
                },
              ]}
            />
          </Box>
        </Toolbar>
        <Collapse in={isApplyDisabled}>
          <Alert
            severity="warning"
            action={
              <Tooltip title={T.AutomationFull} arrow>
                <InfoIcon aria-label="info" color="inherit" size="small">
                  <CloseIcon fontSize="inherit" />
                </InfoIcon>
              </Tooltip>
            }
            sx={{
              borderRadius: 0,
              borderTop: '1px solid grey',
            }}
          >
            {T.AutomationEnabled}
          </Alert>
        </Collapse>
      </AppBar>

      <EnhancedTable
        columns={columns}
        data={useMemo(
          () => (loadingColumns ? [] : tableData),
          [tableData, loadingColumns]
        )}
        RowComponent={component}
        disableRowSelect
        isLoading={isLoading || loadingColumns}
        disableGlobalSort
        disableGlobalActions
        headerList={header && genColumns}
      />
    </Box>
  )
}

ExecutionTimeline.propTypes = {
  data: PropTypes.shape({
    ACTION: PropTypes.arrayOf(
      PropTypes.shape({
        ID: PropTypes.string.isRequired,
        OPERATION: PropTypes.string.isRequired,
        VM_ID: PropTypes.string.isRequired,
        HOST_ID: PropTypes.string.isRequired,
        DS_ID: PropTypes.string.isRequired,
        STATE: PropTypes.string.isRequired,
        TIMESTAMP: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  refetch: PropTypes.func,
  isLoading: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  isApplyDisabled: PropTypes.bool,
  isApplyHidden: PropTypes.bool,
  isDrsEnabled: PropTypes.bool,
  handleApplyPlan: PropTypes.func,
  handleDeletePlan: PropTypes.func,
  handleOptimization: PropTypes.func,
}

export default ExecutionTimeline
