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
import { transformApiResponseToDataset } from 'client/components/Charts/MultiChart/helpers/scripts'
import { useGetShowbackPoolQuery } from 'client/features/OneApi/vm'
import { Box } from '@mui/material'
import { Component } from 'react'

const keyMap = {
  VMID: 'OID',
  VMNAME: 'NAME',
  UNAME: 'UNAME',
  GNAME: 'GNAME',
  YEAR: 'YEAR',
  MONTH: 'MONTH',
  CPU_COST: 'cpuCost',
  MEMORY_COST: 'memoryCost',
  DISK_COST: 'diskCost',
  TOTAL_COST: 'totalCost',
  HOURS: 'hours',
  RHOURS: 'rHours',
}

const DataGridColumns = [
  { field: 'OID', headerName: 'ID', flex: 1 },
  { field: 'NAME', headerName: 'Name', flex: 1 },
  { field: 'UNAME', headerName: 'Owner', flex: 1 },
  { field: 'totalCost', headerName: 'Cost', flex: 1, type: 'number' },
  { field: 'hours', headerName: 'Hours', flex: 1, type: 'number' },
]

const smallTableColumns = [
  { field: 'MONTH', headerName: 'Month', flex: 1 },
  { field: 'totalCost', headerName: 'Total Cost', flex: 1, type: 'number' },
]

const metricKeys = ['cpuCost', 'memoryCost', 'diskCost', 'totalCost']

const metricNames = {
  cpuCost: 'CPU',
  memoryCost: 'Memory',
  diskCost: 'Disk',
}

const topMetricNames = {
  MONTH: 'Month',
  totalCost: 'Total Cost',
}

const commonStyles = {
  minHeight: '250px',
  width: '100%',
  position: 'relative',
  marginTop: 2,
}

const labelingFunc = (record) => `${record.YEAR}-${record.MONTH}`

/**
 * ShowbackInfoTab component displays showback information for a user.
 *
 * @param {object} props - Component properties.
 * @param {string} props.id - User ID.
 * @returns {Component} Rendered component.
 */
const ShowbackInfoTab = ({ id }) => {
  const filter = id
  const startMonth = -1
  const startYear = -1
  const endMonth = -1
  const endYear = -1

  const queryData = useGetShowbackPoolQuery({
    filter,
    startMonth,
    startYear,
    endMonth,
    endYear,
  })

  const isLoading = queryData.isLoading
  let transformedResult
  let processedApiData
  let error

  if (!isLoading && queryData.isSuccess) {
    transformedResult = transformApiResponseToDataset(
      queryData,
      keyMap,
      metricKeys,
      labelingFunc
    )
    processedApiData = transformedResult.dataset
    error = transformedResult.error
  }

  if (
    isLoading ||
    error ||
    !processedApiData ||
    (processedApiData &&
      processedApiData.data.length === 1 &&
      !Object.keys(processedApiData.data[0]).length)
  ) {
    return <LoadingDisplay isLoading={isLoading} error={error} />
  }

  const aggregateTotalCostByMonth = (dataset) => {
    const aggregated = dataset.data.reduce((acc, record) => {
      if (
        record.MONTH &&
        record.totalCost !== null &&
        record.totalCost !== undefined
      ) {
        if (!acc[record.MONTH]) {
          acc[record.MONTH] = { ...record, totalCost: 0 }
        }
        acc[record.MONTH].totalCost += parseFloat(record.totalCost)
      }

      return acc
    }, {})

    return {
      ...dataset,
      data: Object.values(aggregated),
    }
  }
  const topChartsData = [processedApiData].map(aggregateTotalCostByMonth)

  return (
    <Box padding={2} display="flex" flexDirection="column" height="100%">
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        mb={2}
      >
        <Box flexGrow={1} mr={1} {...commonStyles}>
          <MultiChart
            datasets={topChartsData}
            chartType={'table'}
            tableColumns={smallTableColumns}
            groupBy={'MONTH'}
            metricNames={topMetricNames}
          />
        </Box>

        <Box flexGrow={1} ml={1} {...commonStyles}>
          <MultiChart
            datasets={topChartsData}
            chartType={'bar'}
            ItemsPerPage={12}
            groupBy={'MONTH'}
            metricNames={topMetricNames}
            selectedMetrics={{ totalCost: true }}
          />
        </Box>
      </Box>

      <Box flexGrow={1} minHeight="400px" {...commonStyles}>
        <MultiChart
          datasets={[processedApiData]}
          chartType={'table'}
          ItemsPerPage={7}
          tableColumns={DataGridColumns}
          groupBy={'MONTH'}
          metricNames={metricNames}
        />
      </Box>
    </Box>
  )
}

ShowbackInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ShowbackInfoTab.displayName = 'ShowbackInfoTab'

export default ShowbackInfoTab
