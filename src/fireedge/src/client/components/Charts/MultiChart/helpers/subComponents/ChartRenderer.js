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
import React from 'react'
import PropTypes from 'prop-types'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { mapValues } from 'lodash'

import { Tr } from 'client/components/HOC'
import { DataGridTable } from 'client/components/Tables'
import { useTheme } from '@mui/material'
import { CustomTooltip } from 'client/components/Tooltip'
import { sentenceCase } from 'client/utils'

import {
  generateColorByMetric,
  GetChartConfig,
  GetChartElementConfig,
  CustomXAxisTick,
} from 'client/components/Charts/MultiChart/helpers/scripts'
import {
  FormatPolarDataset,
  PolarTooltip,
} from 'client/components/Charts/MultiChart/helpers/subComponents'

const CHART_TYPES = {
  BAR: 'bar',
  LINE: 'line',
  AREA: 'area',
  TABLE: 'table',
  STACKED_BAR: 'stackedBar',
  RADIAL_BAR: 'radialBar',
}

const ChartComponents = {
  CARTESIAN: {
    [CHART_TYPES.BAR]: BarChart,
    [CHART_TYPES.STACKED_BAR]: BarChart,
    [CHART_TYPES.LINE]: LineChart,
    [CHART_TYPES.AREA]: AreaChart,
    [CHART_TYPES.TABLE]: DataGridTable,
  },
  POLAR: {
    [CHART_TYPES.RADIAL_BAR]: RadialBarChart,
  },
}

const ChartElements = {
  CARTESIAN: {
    [CHART_TYPES.BAR]: Bar,
    [CHART_TYPES.STACKED_BAR]: Bar,
    [CHART_TYPES.LINE]: Line,
    [CHART_TYPES.AREA]: Area,
  },
  POLAR: {
    [CHART_TYPES.RADIAL_BAR]: RadialBar,
  },
}

/**
 * Renders a chart based on the provided type and data.
 *
 * @param {object} props - The properties for the component.
 * @param {'bar' | 'line' | 'area' | 'table'} props.chartType - The type of chart to render.
 * @param {Array} props.datasets - The datasets to be used for the chart.
 * @param {object} props.selectedMetrics - The metrics selected for display.
 * @param {Function} props.customChartDefs - Custom definitions for the chart.
 * @param {Array} props.paginatedData - The paginated data for the chart.
 * @param {Array} props.tableColumns - The columns for the table chart type.
 * @param {Function} props.humanReadableMetric - Function to convert metric keys to human-readable format.
 * @param {string} props.groupBy - The variable to group data under.
 * @param {object} props.metricHues - Object containing hue values for different metrics.
 * @param {boolean} props.disableLegend - Disables the legend underneath the charts.
 * @param {string} props.coordinateType - Cartesian or Polar coordinate system.
 * @param {Function} props.onElementClick - Callback to handle element click event.
 * @returns {React.Component} The rendered chart component.
 */
export const ChartRenderer = ({
  chartType,
  datasets,
  selectedMetrics,
  customChartDefs,
  paginatedData,
  tableColumns,
  humanReadableMetric,
  groupBy,
  coordinateType,
  metricHues,
  disableLegend,
  onElementClick,
}) => {
  const ChartComponent = ChartComponents[coordinateType][chartType]
  const ChartElement = ChartElements[coordinateType][chartType]
  const theme = useTheme()

  // Map with translation for each metric
  const translationMap = mapValues(selectedMetrics, (value, key) => {
    const finalWord = key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    return Tr(finalWord)
  })

  const polarDataset =
    coordinateType === 'POLAR' ? FormatPolarDataset(datasets) : null

  const chartConfig = GetChartConfig(
    coordinateType,
    chartType,
    coordinateType === 'CARTESIAN' ? datasets : polarDataset,
    paginatedData
  )

  // Translate columns in tables
  const tableColumnsTranslated = tableColumns?.map((column) => ({
    ...column,
    headerName: Tr(column.headerName),
  }))

  return (
    <ResponsiveContainer height="100%" width="100%">
      {chartType === CHART_TYPES.TABLE ? (
        <DataGridTable
          columns={tableColumnsTranslated}
          data={datasets}
          selectedItems={selectedMetrics}
        />
      ) : (
        <ChartComponent {...chartConfig}>
          {coordinateType === 'CARTESIAN'
            ? datasets.map((dataset) =>
                customChartDefs(
                  dataset.metrics.map((m) => m.key),
                  dataset.id,
                  metricHues,
                  coordinateType,
                  groupBy
                )
              )
            : customChartDefs(
                polarDataset.map((entry) => entry.name),
                datasets[0].id,
                metricHues,
                coordinateType,
                groupBy
              )}

          {coordinateType === 'CARTESIAN' && (
            <>
              <XAxis
                interval={0}
                dataKey={groupBy}
                tick={<CustomXAxisTick />}
              />
              <YAxis />
            </>
          )}

          <Tooltip
            content={
              coordinateType === 'CARTESIAN' ? (
                <CustomTooltip
                  labels={datasets.map((ds) => Tr(sentenceCase(ds.label)))}
                  generateColor={generateColorByMetric}
                  formatMetric={humanReadableMetric}
                  metricHues={metricHues}
                />
              ) : (
                <PolarTooltip />
              )
            }
            cursor={coordinateType === 'CARTESIAN' ? 'pointer' : false}
          />

          {!disableLegend &&
            (coordinateType === 'CARTESIAN' ? (
              <Legend
                formatter={(value) => {
                  const [metric, datasetId] = value.split('-')
                  const currentDataset = datasets.find(
                    (ds) => ds.id === parseInt(datasetId, 10)
                  )

                  const lastSelectedMetric = [...currentDataset.metrics]
                    .reverse()
                    .find((m) => selectedMetrics[m.key])

                  if (lastSelectedMetric && metric === lastSelectedMetric.key) {
                    return `${humanReadableMetric(metric)}`
                  }

                  return humanReadableMetric(metric)
                }}
                wrapperStyle={{
                  wordWrap: 'break-word',
                  maxWidth: '100%',
                }}
              />
            ) : (
              <Legend
                formatter={(value) => translationMap[value]}
                iconSize={12}
                layout="vertical"
                verticalAlign="middle"
                wrapperStyle={{
                  padding: '0.2rem',
                  overflow: 'auto',
                  height: '40%',
                  width: '20%',
                  top: -60,
                  left: 0,
                  lineHeight: '30px',
                }}
              />
            ))}
          {coordinateType === 'CARTESIAN' ? (
            datasets.map((dataset) =>
              dataset.metrics.map((metric) =>
                selectedMetrics[metric.key] ? (
                  <ChartElement
                    {...GetChartElementConfig(
                      chartType,
                      metric,
                      dataset,
                      coordinateType,
                      theme
                    )}
                    onClick={onElementClick}
                  />
                ) : null
              )
            )
          ) : (
            <ChartElement
              {...GetChartElementConfig(
                chartType,
                polarDataset?.[0]?.name, // Can always use the first datasets ID for polar charts
                polarDataset,
                coordinateType,
                theme,
                datasets?.[0]?.id
              )}
              onClick={onElementClick}
            />
          )}
        </ChartComponent>
      )}
    </ResponsiveContainer>
  )
}

ChartRenderer.propTypes = {
  chartType: PropTypes.oneOf([
    'bar',
    'line',
    'area',
    'table',
    'stackedBar',
    'radialBar',
  ]).isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedMetrics: PropTypes.object.isRequired,
  customChartDefs: PropTypes.func.isRequired,
  paginatedData: PropTypes.arrayOf(PropTypes.object).isRequired,
  tableColumns: PropTypes.arrayOf(PropTypes.object),
  humanReadableMetric: PropTypes.func.isRequired,
  groupBy: PropTypes.string.isRequired,
  coordinateType: PropTypes.string,
  metricHues: PropTypes.objectOf(PropTypes.number).isRequired,
  disableLegend: PropTypes.bool,
  onElementClick: PropTypes.func,
}

ChartRenderer.defaultProps = {
  groupBy: 'pct',
  disableLegend: false,
  coordinateType: 'CARTESIAN',
}
