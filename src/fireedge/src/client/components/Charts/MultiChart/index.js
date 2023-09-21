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
import React, { useState, useMemo, useEffect } from 'react'
import { Box } from '@mui/material'

import {
  ChartRenderer,
  NavigationController,
  ExportButton,
} from 'client/components/Charts/MultiChart/helpers/subComponents'
import { LoadingDisplay } from 'client/components/LoadingState'
import {
  processDataForChart,
  GetChartDefs,
} from 'client/components/Charts/MultiChart/helpers/scripts'

/**
 * @param {object} props - Component properties.
 * @param {Array} props.datasets - Array of datasets to visualize.
 * @param {Array} props.visibleDatasets - Array of visible dataset IDs (subset of datasets).
 * @param {Array} props.xAxisLabels - Array of unique names for the X-axis.
 * @param {string} props.chartType - Type of chart to render ('bar', 'line', etc.).
 * @param {object} props.selectedMetrics - Object containing selected metrics (e.g., "cpuHours").
 * @param {string} props.error - Error message, if any.
 * @param {boolean} props.isLoading - Indicator whether data is still being fetched or not.
 * @param {string} props.groupBy - Key to group X values by.
 * @param {number} props.ItemsPerPage - Number of items to display per page.
 * @param {Array} props.tableColumns - Array of table column configurations.
 * @param {Function} props.customChartDefs - Function to generate custom chart definitions.
 * @param {object} [props.metricNames={}] - Object mapping metric keys to human-readable names.
 * @param {object} props.metricHues - Object containing hue values for different metrics.
 * @param {boolean} props.disableExport - Enable/Disable export button.
 * @param {boolean} props.disableLegend - Disables the legend underneath the charts.
 * @returns {React.Component} MultiChart component.
 */
const MultiChart = ({
  datasets,
  visibleDatasets,
  xAxisLabels: passedxAxisLabels,
  chartType,
  selectedMetrics: passedSelectedMetrics,
  error,
  isLoading,
  ItemsPerPage,
  tableColumns,
  customChartDefs,
  metricNames,
  groupBy,
  disableExport,
  disableLegend,
  metricHues: passedMetricHues,
}) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedXValues, setSelectedXValues] = useState([])
  const [isFilterDisabled, setIsFilterDisabled] = useState(true)
  const [isPaginationDisabled, setIsPaginationDisabled] = useState(true)

  const xAxisLabels = useMemo(() => {
    if (passedxAxisLabels && passedxAxisLabels.length > 0) {
      return passedxAxisLabels
    }

    return [
      ...new Set(
        datasets
          .filter((dataset) => !dataset.isEmpty)
          .flatMap((dataset) => dataset.data.map((item) => item[groupBy]))
      ),
    ]
  }, [datasets, groupBy, passedxAxisLabels])

  const selectedMetrics = useMemo(() => {
    if (
      passedSelectedMetrics &&
      Object.keys(passedSelectedMetrics).length > 0
    ) {
      return passedSelectedMetrics
    }

    return datasets.reduce((acc, dataset) => {
      if (!dataset.isEmpty && dataset.metrics) {
        dataset.metrics.forEach((metric) => {
          acc[metric.key] = true
        })
      }

      return acc
    }, {})
  }, [datasets, passedSelectedMetrics])

  const metricHues = useMemo(() => {
    if (passedMetricHues && Object.keys(passedMetricHues).length > 0) {
      return passedMetricHues
    }

    const allMetrics = [
      ...new Set(
        datasets.flatMap((dataset) =>
          dataset.isEmpty || !dataset.metrics
            ? []
            : dataset.metrics.map((metric) => metric.key)
        )
      ),
    ]

    const hueStep = 360 / allMetrics.length

    return allMetrics.reduce((acc, metric, index) => {
      acc[metric] = index * hueStep

      return acc
    }, {})
  }, [datasets, passedMetricHues])

  const visibleDatasetIDs = useMemo(() => {
    if (visibleDatasets !== undefined) {
      return visibleDatasets
    }

    return datasets.map((dataset) => dataset.id)
  }, [datasets, visibleDatasets])

  const noDataAvailable = useMemo(() => {
    if (visibleDatasetIDs.length === 0) {
      return true
    }

    const allEmpty = visibleDatasetIDs.every((id) => {
      // eslint-disable-next-line no-shadow
      const dataset = datasets.find((dataset) => dataset.id === id)

      return dataset.isEmpty
    })

    return allEmpty
  }, [datasets, visibleDatasetIDs])

  const mergedDataForXAxis = processDataForChart(
    xAxisLabels,
    datasets,
    visibleDatasetIDs,
    groupBy
  )

  const humanReadableMetric = (key) => metricNames[key] || key

  useEffect(() => {
    setSelectedXValues(xAxisLabels)
  }, [xAxisLabels])

  useEffect(() => {
    setIsFilterDisabled(noDataAvailable || visibleDatasetIDs.length === 0)
  }, [noDataAvailable, visibleDatasetIDs])

  useEffect(() => {
    setIsPaginationDisabled(
      selectedXValues.length <= ItemsPerPage || isFilterDisabled
    )
  }, [selectedXValues, isFilterDisabled])

  const paginatedData = useMemo(() => {
    const filteredData = mergedDataForXAxis.filter((item) =>
      selectedXValues.includes(item[groupBy])
    )
    const start = currentPage * ItemsPerPage
    const end = start + ItemsPerPage

    return filteredData.slice(start, end)
  }, [mergedDataForXAxis, currentPage, selectedXValues])

  return (
    <Box width="100%" height="100%" display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-between" minHeight="40px">
        {chartType !== 'table' && (
          <Box flex={1}>
            <NavigationController
              onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              onNext={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(selectedXValues.length / ItemsPerPage) - 1
                  )
                )
              }
              isPrevDisabled={currentPage === 0}
              isNextDisabled={
                currentPage ===
                Math.ceil(selectedXValues.length / ItemsPerPage) - 1
              }
              selectedItems={selectedXValues}
              items={xAxisLabels}
              setSelectedItems={setSelectedXValues}
              isFilterDisabled={isFilterDisabled}
              isPaginationDisabled={isPaginationDisabled}
            />
          </Box>
        )}
        {!disableExport && (
          <Box flex={1} display="flex" justifyContent="flex-end">
            <ExportButton data={datasets} />
          </Box>
        )}
      </Box>

      <Box flex={1} mt={-1}>
        {isLoading || error || noDataAvailable ? (
          <LoadingDisplay isLoading={isLoading} error={error} />
        ) : (
          <ChartRenderer
            chartType={chartType}
            datasets={datasets}
            selectedMetrics={selectedMetrics}
            customChartDefs={customChartDefs}
            tableColumns={tableColumns}
            paginatedData={paginatedData}
            humanReadableMetric={humanReadableMetric}
            groupBy={groupBy}
            metricHues={metricHues}
            disableLegend={disableLegend}
          />
        )}
      </Box>
    </Box>
  )
}

MultiChart.propTypes = {
  datasets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      data: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        })
      ).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  visibleDatasets: PropTypes.arrayOf(PropTypes.number),
  xAxisLabels: PropTypes.arrayOf(PropTypes.string),
  chartType: PropTypes.oneOf(['bar', 'line', 'area', 'table', 'stackedBar']),
  selectedMetrics: PropTypes.object,
  error: PropTypes.string,
  isLoading: PropTypes.bool,
  groupBy: PropTypes.string,
  disableExport: PropTypes.bool,
  disableLegend: PropTypes.bool,
  ItemsPerPage: PropTypes.number.isRequired,
  tableColumns: PropTypes.arrayOf(PropTypes.object),
  customChartDefs: PropTypes.func.isRequired,
  metricNames: PropTypes.object,
  metricHues: PropTypes.objectOf(PropTypes.number),
}

MultiChart.defaultProps = {
  chartType: 'bar',
  ItemsPerPage: 10,
  groupBy: 'ID',
  customChartDefs: GetChartDefs,
  metricNames: {},
  metricHues: {},
  disableExport: false,
  disableLegend: false,
}

export default MultiChart
