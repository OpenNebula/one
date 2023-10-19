/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { LoadingDisplay } from 'client/components/LoadingState'
import { MultiChart } from 'client/components/Charts'
import {
  transformApiResponseToDataset,
  filterDataset,
} from 'client/components/Charts/MultiChart/helpers/scripts'
import { useGetVmsQuery } from 'client/features/OneApi/vm'
import { useGetVMGroupQuery } from 'client/features/OneApi/vmGroup'
import { Box } from '@mui/material'
import { Component } from 'react'
import { useGeneralApi } from 'client/features/General'
import { VM_STATES } from 'client/constants'
const keyMap = {
  ID: 'ID',
  NAME: 'NAME',
  UNAME: 'OWNER',
  GNAME: 'GROUP',
  STATE: 'STATUS',
}

const DataGridColumns = [
  { field: 'ID', headerName: 'ID', flex: 1 },
  { field: 'NAME', headerName: 'Name', flex: 1 },
  { field: 'OWNER', headerName: 'Owner', flex: 1 },
  { field: 'GROUP', headerName: 'Group', flex: 1 },
  {
    field: 'STATUS',
    headerName: 'State',
    flex: 1,
    valueFormatter: (params) =>
      VM_STATES?.[+params?.value]?.name?.split('_')?.join(' ') ?? 'UNKNOWN',
  },
]

const commonStyles = {
  minHeight: '250px',
  width: '100%',
  position: 'relative',
  marginTop: 2,
}

/**
 * VmsInfoTab component displays showback information for a user.
 *
 * @param {object} props - Component properties.
 * @param {string} props.id - User ID.
 * @returns {Component} Rendered component.
 */
const VmsInfoTab = ({ id }) => {
  const { enqueueError } = useGeneralApi()
  const roleData = useGetVMGroupQuery({ id })?.data?.ROLES?.ROLE
  const includedVms = [
    ...new Set(
      (Array.isArray(roleData) ? roleData : [roleData])
        .flatMap((role) => role?.VMS)
        .filter(Boolean)
    ),
  ]

  includedVms?.isError &&
    enqueueError('Failed to fetch vm groups, displaying all VMs')
  const startMonth = -2
  const startYear = -2
  const endMonth = -2
  const endYear = -2

  const queryData = useGetVmsQuery({
    startMonth,
    startYear,
    endMonth,
    endYear,
  })

  const metricKeys = ['ID']

  const isLoading = queryData.isLoading
  let error

  let filteredResult

  if (!isLoading && queryData.isSuccess) {
    const transformedResult = transformApiResponseToDataset(
      queryData,
      keyMap,
      metricKeys
    )
    error = transformedResult.error

    filteredResult = filterDataset(transformedResult.dataset, ({ ID }) =>
      includedVms.includes(ID)
    )?.dataset
  }

  if (isLoading || error) {
    return <LoadingDisplay isLoading={isLoading} error={error} />
  }

  return (
    <Box padding={2} display="flex" flexDirection="column" height="100%">
      <Box flexGrow={1} minHeight="400px" {...commonStyles}>
        <MultiChart
          datasets={[
            { ...filteredResult, isEmpty: !filteredResult.data.length },
          ]}
          chartType={'table'}
          tableColumns={DataGridColumns}
        />
      </Box>
    </Box>
  )
}

VmsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmsInfoTab.displayName = 'VmsInfoTab'

export default VmsInfoTab
