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
import React from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { mapValues } from 'lodash'
import { MultiChart, Table } from '@ComponentsV2Module'
import { useTranslation } from '@ProvidersModule'

const commonStyles = {
  width: '100%',
  height: 500,
  position: 'relative',
}

const metricNames = {
  cpuHours: 'CPU',
  memoryGBHours: 'Memory',
  diskMBHours: 'Disk',
}

const formatDate = (value, fallbackToCurrentDate = false) => {
  if (!value || isNaN(value) || value === '0') {
    return fallbackToCurrentDate
      ? new Date().toISOString().split('T')[0]
      : '1970-01-01'
  }

  return new Date(Number(value) * 1000).toISOString().split('T')[0]
}

const getTableColumns = (translate) => [
  { accessorKey: 'OID', header: 'OID' },
  { accessorKey: 'NAME', header: translate('Name') },
  {
    accessorKey: 'STIME',
    header: translate('Start Time'),
    cell: ({ getValue }) => formatDate(getValue()),
  },
  {
    accessorKey: 'ETIME',
    header: translate('End Time'),
    cell: ({ getValue }) => formatDate(getValue(), true),
  },
  { accessorKey: 'cpuHours', header: translate('CPU Hours') },
  { accessorKey: 'memoryGBHours', header: translate('Memory GB Hours') },
  { accessorKey: 'diskMBHours', header: translate('Disk MB Hours') },
]

const getTableData = (datasetList, visibleDatasetIds) =>
  datasetList
    .filter((dataset) => visibleDatasetIds.includes(dataset.id))
    .flatMap((dataset) => dataset.data ?? [])

/**
 * CustomizedChart component.
 *
 * @param {object} props - Props
 * @param {Array} props.datasets - Array of datasets.
 * @param {Array} props.visibleDatasets - Array of visible dataset IDs.
 * @param {string} props.chartType - Type of the chart.
 * @param {object} props.selectedMetrics - Object of selected metrics.
 * @param {string} props.error - Error message.
 * @param {boolean} props.isLoading - Indicator whether data is still being fetched or not.
 * @param {string} props.groupBy - Key to group X values by.
 * @returns {React.Component} CustomizedChart component.
 */
export const CustomizedChart = ({
  datasets,
  visibleDatasets,
  chartType,
  selectedMetrics,
  error,
  isLoading,
  groupBy,
}) => {
  const { translate } = useTranslation()
  const metricNamesTranslated = mapValues(metricNames, (value) =>
    translate(value)
  )

  if (chartType === 'table') {
    return (
      <Box sx={commonStyles}>
        <Table
          columns={getTableColumns(translate)}
          data={getTableData(datasets, visibleDatasets)}
          defaultPageSize={10}
        />
      </Box>
    )
  }

  return (
    <Box sx={commonStyles}>
      <MultiChart
        datasets={datasets}
        visibleDatasets={visibleDatasets}
        chartType={chartType}
        selectedMetrics={selectedMetrics}
        ItemsPerPage={7}
        error={error}
        isLoading={isLoading}
        metricNames={metricNamesTranslated}
        groupBy={groupBy}
      />
    </Box>
  )
}

CustomizedChart.propTypes = {
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  visibleDatasets: PropTypes.arrayOf(PropTypes.number).isRequired,
  chartType: PropTypes.string.isRequired,
  selectedMetrics: PropTypes.objectOf(PropTypes.bool).isRequired,
  error: PropTypes.string,
  isLoading: PropTypes.bool,
  groupBy: PropTypes.string,
}

CustomizedChart.defaultProps = {
  error: null,
  groupBy: 'NAME',
}
