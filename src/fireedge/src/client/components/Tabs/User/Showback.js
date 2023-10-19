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
import { DateRangeFilter } from 'client/components/Date'
import {
  useGetShowbackPoolQuery,
  useLazyCalculateShowbackQuery,
} from 'client/features/OneApi/vm'
import { Box, Button } from '@mui/material'
import { Component, useState } from 'react'
import { DateTime } from 'luxon'
import { useGeneralApi } from 'client/features/General'

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
  minHeight: '350px',
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
  const [calculateShowback] = useLazyCalculateShowbackQuery()
  const { enqueueError, enqueueSuccess } = useGeneralApi()

  const filter = Number(id)
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

  const [dateRange, setDateRange] = useState({
    startDate: DateTime.now().minus({ months: 1 }),
    endDate: DateTime.now(),
  })

  const dateFilterFn = (record) => {
    const recordDate = DateTime.fromObject({
      year: parseInt(record.YEAR, 10),
      month: parseInt(record.MONTH, 10),
    })

    return recordDate >= dateRange.startDate && recordDate <= dateRange.endDate
  }

  const handleDateChange = (newDateRange) => {
    setDateRange(newDateRange)
  }

  const handleCalculateClick = async () => {
    const params = {
      startMonth,
      startYear,
      endMonth,
      endYear,
    }

    try {
      await calculateShowback(params)
      enqueueSuccess('Showback calculated')
    } catch (error) {
      enqueueError(`Error calculating showback: ${error.message}`)
    }
  }

  const isLoading = queryData.isLoading
  let error

  const aggregateTotalCostByMonth = (datasetWrapper) => {
    const dataset = datasetWrapper.dataset

    if (!dataset.data || dataset.data.length === 0) {
      return {
        ...dataset,
        isEmpty: datasetWrapper.isEmpty,
      }
    }

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
      id: dataset.id,
      data: Object.values(aggregated),
      metrics: dataset.metrics,
      label: dataset.label,
      isEmpty: datasetWrapper.isEmpty,
    }
  }

  let filteredResult
  let topChartsData

  if (!isLoading && queryData.isSuccess) {
    const transformedResult = transformApiResponseToDataset(
      queryData,
      keyMap,
      metricKeys,
      labelingFunc
    )
    error = transformedResult.error

    filteredResult = filterDataset(
      transformedResult.dataset,
      dateFilterFn,
      labelingFunc
    )

    topChartsData = [filteredResult].map(aggregateTotalCostByMonth)
  }

  if (isLoading || error) {
    return <LoadingDisplay isLoading={isLoading} error={error} />
  }

  return (
    <Box padding={2} display="flex" flexDirection="column" height="100%">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <DateRangeFilter
          initialStartDate={dateRange.startDate}
          initialEndDate={dateRange.endDate}
          onDateChange={handleDateChange}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCalculateClick}
        >
          Calculate Data
        </Button>
      </Box>
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

      <Box flexGrow={1} {...commonStyles} minHeight="500px">
        <MultiChart
          datasets={[
            { ...filteredResult.dataset, isEmpty: filteredResult.isEmpty },
          ]}
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
