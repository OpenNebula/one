/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { DateRangeFilter } from 'client/components/Date'
import { useLazyGetShowbackPoolFilteredQuery } from 'client/features/OneApi/vm'
import { Box, Button } from '@mui/material'
import { Component, useState, useEffect } from 'react'
import { DateTime } from 'luxon'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import { mapValues } from 'lodash'

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
  width: '100%',
  position: 'relative',
  marginTop: 2,
}

const labelingFunc = (record) => `${record.YEAR}-${record.MONTH}`

/**
 * Generates a ShowbackInfoTab for an user or a group.
 *
 * @param {object} props - Input properties
 * @param {boolean} props.groups - If it's a group or not
 * @returns {object} - The ShowbackInfoTab component
 */
const generateShowbackInfoTab = ({ groups }) => {
  /**
   * ShowbackInfoTab component displays showback information for an user or a group.
   *
   * @param {string} id - User or group ID.
   * @returns {Component} Rendered component.
   */
  const ShowbackInfoTab = ({ id }) => {
    // Create hooks for chart data
    const [topChartsData, setTopChartsData] = useState([])
    const [transformedResult, setTransformedResult] = useState()

    // Create hooks for date range
    const [dateRange, setDateRange] = useState({
      startDate: DateTime.now().minus({ months: 1 }),
      endDate: DateTime.now(),
    })

    const handleDateChange = (newDateRange) => {
      setDateRange(newDateRange)
    }

    // Hook for fetch data
    const [getShowback, queryData] = useLazyGetShowbackPoolFilteredQuery()

    // Call the API to refetch data
    const refetchData = () => {
      const paramName = groups ? 'group' : 'user'
      getShowback({
        [paramName]: id,
        startMonth: dateRange.startDate.month,
        startYear: dateRange.startDate.year,
        endMonth: dateRange.endDate.month,
        endYear: dateRange.endDate.year,
      })
    }

    // Refetch data when click on Get showback button
    const handleGetShowbackClick = () => refetchData()

    // First render of the component
    useEffect(() => refetchData(), [])

    // Hook after fetch data
    useEffect(() => {
      if (!queryData.isLoading && queryData.data) {
        // Transform data
        const transformedResultData = transformApiResponseToDataset(
          queryData,
          keyMap,
          metricKeys,
          labelingFunc
        )

        // Update data
        setTransformedResult(transformedResultData)
        setTopChartsData([transformedResultData].map(aggregateTotalCostByMonth))
      }
    }, [queryData])

    // Create dataset function
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

      // Return dataset
      return {
        id: dataset.id,
        data: Object.values(aggregated),
        metrics: dataset.metrics,
        label: dataset.label,
        isEmpty: datasetWrapper.isEmpty,
      }
    }

    // Show loading component
    if (
      queryData.isLoading ||
      queryData.isFetching ||
      queryData.isError ||
      !queryData.data ||
      !topChartsData ||
      topChartsData.length === 0
    ) {
      return (
        <LoadingDisplay
          isLoading={queryData.isLoading || queryData.isFetching}
        />
      )
    }

    const topMetricNamesTranslated = mapValues(topMetricNames, (value, key) =>
      Tr(value)
    )
    const metricNamesTranslated = mapValues(metricNames, (value, key) =>
      Tr(value)
    )

    return (
      <Box
        padding={2}
        display="flex"
        flexDirection="column"
        sx={{
          height: '100vh',
          minHeight: '1000px',
        }}
      >
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
            views={['month', 'year']}
          />
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGetShowbackClick}
          >
            {Tr(T['showback.button.getShowback'])}
          </Button>
        </Box>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          mb={2}
          flex={5}
        >
          <Box flex={1} mr={1} {...commonStyles}>
            <MultiChart
              datasets={topChartsData}
              chartType={'table'}
              tableColumns={smallTableColumns}
              groupBy={'MONTH'}
              metricNames={topMetricNamesTranslated}
            />
          </Box>

          <Box flex={1} ml={1} {...commonStyles}>
            <MultiChart
              datasets={topChartsData}
              chartType={'bar'}
              ItemsPerPage={12}
              groupBy={'MONTH'}
              metricNames={topMetricNamesTranslated}
              selectedMetrics={{ totalCost: true }}
            />
          </Box>
        </Box>

        <Box flex={7} {...commonStyles}>
          <MultiChart
            datasets={[
              {
                ...transformedResult?.dataset,
                isEmpty: transformedResult?.isEmpty,
              },
            ]}
            chartType={'table'}
            ItemsPerPage={7}
            tableColumns={DataGridColumns}
            groupBy={'MONTH'}
            metricNames={metricNamesTranslated}
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

  return ShowbackInfoTab
}

export default generateShowbackInfoTab
