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
import { ReactElement, useMemo, useState } from 'react'
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import { RefreshDouble } from 'iconoir-react'
import { AlertNotification, Button, Table, Tooltip } from '@ComponentsV2Module'
import { BACKUPJOB_ACTIONS, RESOURCE_NAMES, T } from '@ConstantsModule'
import { BackupJobAPI } from '@FeaturesModule'
import { getBackupJobVmIds, vmsTable } from '@ModelsModule'
import AttachVms from '@modules/resources/resources/BackupJobs/Tabs/VMs/Actions'
import {
  alertStyles,
  getContainerStyles,
  getPanelStyles,
  getPanelTitleStyles,
  getTableHeaderStyles,
  tableTitleStyles,
} from '@modules/resources/resources/BackupJobs/Tabs/VMs/styles'

const HIDDEN_COLUMN_IDS = [
  'type',
  'labels',
  'hostname',
  'vmhostname',
  'locked',
  'ips',
  'console',
]

const STATE_BACKING_UP = 'backingUp'
const STATE_ERROR = 'error'
const STATE_OUTDATED = 'outdated'
const STATE_ALL = 'all'

const STATES = {
  [STATE_ALL]: {
    select: T.All,
    title: T.VMsBackupJob,
    value: '',
  },
  [STATE_BACKING_UP]: {
    select: T.VMsBackupJobBackingUpState,
    title: T.VMsBackupJobBackingUp,
    value: 'BACKING_UP_VMS',
  },
  [STATE_ERROR]: {
    select: T.Error,
    title: T.VMsBackupJobError,
    value: 'ERROR_VMS',
  },
  [STATE_OUTDATED]: {
    select: T.VMsBackupJobOutdatedState,
    title: T.VMsBackupJobOutdated,
    value: 'OUTDATED_VMS',
  },
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {ReactElement} - BackupJob VMs tab
 */
export const VMs = ({ data }) => {
  const { availableActions = {}, isActionsDisabled, isLocked } = data || {}
  const selectedBackupJob = [].concat(data?.selected).filter(Boolean)?.[0] ?? {}
  const [state, setState] = useState(STATE_ALL)
  const {
    data: fetchedBackupJob = {},
    isFetching,
    refetch,
  } = BackupJobAPI.useGetBackupJobQuery(
    { id: selectedBackupJob?.ID },
    { skip: selectedBackupJob?.ID === undefined }
  )
  const backupjob =
    String(fetchedBackupJob?.ID) === String(selectedBackupJob?.ID)
      ? fetchedBackupJob
      : selectedBackupJob
  const { ID, TEMPLATE, OUTDATED_VMS = {} } = backupjob
  const selectedVmIds = useMemo(
    () => getBackupJobVmIds(backupjob, STATES[state]?.value),
    [backupjob, state]
  )
  const stateOptions = useMemo(
    () =>
      Object.entries(STATES).map(([value, { select }]) => ({
        text: select,
        value,
      })),
    []
  )

  const handleChangeState = (_, value) => setState(value)
  const isAttachVmsVisible =
    availableActions?.[BACKUPJOB_ACTIONS.UPDATE_DIALOG] === true

  const { data: vmData = [] } = vmsTable.useData(
    { extended: 0 },
    {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.filter((vm) => {
          if (!backupjob?.ID) {
            return true
          }

          return selectedVmIds.includes(String(vm.ID))
        }),
      }),
    }
  )

  const columns = useMemo(
    () =>
      vmsTable.columns().filter(({ id }) => !HIDDEN_COLUMN_IDS.includes(id)),
    []
  )

  return (
    <Box sx={getContainerStyles}>
      <FormControl>
        <Box sx={(theme) => getPanelStyles({ theme })}>
          <Typography noWrap sx={(theme) => getPanelTitleStyles({ theme })}>
            {T.FilterBy}
          </Typography>
          <RadioGroup
            row
            aria-labelledby="filter_vms"
            value={state}
            onChange={handleChangeState}
            sx={{
              gap: '16px',
              '& .MuiFormControlLabel-root': {
                m: 0,
              },
            }}
          >
            {stateOptions.map(({ text, value }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio size="small" />}
                label={text}
              />
            ))}
          </RadioGroup>
        </Box>
      </FormControl>

      <Box sx={(theme) => getPanelStyles({ theme })}>
        <Box sx={(theme) => getTableHeaderStyles({ theme })}>
          <Typography noWrap sx={tableTitleStyles}>
            {STATES[state]?.title}
          </Typography>
          {isAttachVmsVisible && (
            <AttachVms
              id={ID}
              template={TEMPLATE}
              isDisabled={!!(isActionsDisabled || isLocked)}
            />
          )}
        </Box>

        {!!OUTDATED_VMS?.ID && state === STATE_OUTDATED && (
          <Box
            sx={{
              ...alertStyles,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertNotification
              type="primary"
              status="warning"
              description={T.BackupJobRefresh}
              isDismissible={false}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <Tooltip title={T.Refresh}>
              <span>
                <Button
                  type="transparent"
                  size="medium"
                  iconOnly={<RefreshDouble width="16px" height="16px" />}
                  onClick={() => ID !== undefined && refetch()}
                  isDisabled={isFetching}
                />
              </span>
            </Tooltip>
          </Box>
        )}

        <Table
          columns={columns}
          data={[].concat(vmData)}
          isRowsSelectable={false}
          isEnableSearchBar={true}
          isEnableSort={true}
          isEnableFilters={true}
          openRowDetailsOnClick
          rowDetailsResourceId={RESOURCE_NAMES.VM}
        />
      </Box>
    </Box>
  )
}

VMs.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

VMs.id = 'vms'
VMs.title = T.VMs

export default VMs
