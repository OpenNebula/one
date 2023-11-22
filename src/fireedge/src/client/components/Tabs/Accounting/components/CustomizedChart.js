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
import React from 'react'
import PropTypes from 'prop-types'
import { MultiChart } from 'client/components/Charts'
import { Box } from '@mui/material'

const commonStyles = {
  height: '500px',
  width: '100%',
  position: 'relative',
  marginTop: 6,
}

const metricNames = {
  cpuHours: 'CPU',
  memoryGBHours: 'Memory',
  diskMBHours: 'Disk',
}

const DataGridColumns = [
  { field: 'OID', headerName: 'OID', flex: 1 },
  { field: 'NAME', headerName: 'Name', flex: 1 },
  {
    field: 'STIME',
    headerName: 'Start Time',
    flex: 1,
    valueFormatter: (params) =>
      !params.value || isNaN(params.value)
        ? '1970-01-01'
        : new Date(Number(params.value) * 1000).toISOString().split('T')[0],
  },
  {
    field: 'ETIME',
    headerName: 'End Time',
    flex: 1,
    valueFormatter: (params) =>
      !params.value || isNaN(params.value) || params.value === '0'
        ? new Date().toISOString().split('T')[0]
        : new Date(Number(params.value) * 1000).toISOString().split('T')[0],
  },
  { field: 'cpuHours', headerName: 'CPU Hours', flex: 1, type: 'number' },
  {
    field: 'memoryGBHours',
    headerName: 'Memory GB Hours',
    flex: 1,
    type: 'number',
  },
  {
    field: 'diskMBHours',
    headerName: 'Disk MB Hours',
    flex: 1,
    type: 'number',
  },
]

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
}) => (
  <Box style={commonStyles}>
    <MultiChart
      datasets={datasets}
      visibleDatasets={visibleDatasets}
      chartType={chartType}
      selectedMetrics={selectedMetrics}
      ItemsPerPage={7}
      error={error}
      isLoading={isLoading}
      tableColumns={DataGridColumns}
      metricNames={metricNames}
      groupBy={groupBy}
    />
  </Box>
)

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
