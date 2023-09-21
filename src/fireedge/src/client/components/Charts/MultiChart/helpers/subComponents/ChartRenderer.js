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
import {
  BarChart,
  LineChart,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
  Line,
  Area,
  ResponsiveContainer,
} from 'recharts'

import { DataGridTable } from 'client/components/Tables'
import { CustomTooltip } from 'client/components/Tooltip'

import { generateColorByMetric } from 'client/components/Charts/MultiChart/helpers/scripts'

const CHART_TYPES = {
  BAR: 'bar',
  LINE: 'line',
  AREA: 'area',
  TABLE: 'table',
  STACKED_BAR: 'stackedBar',
}

const ChartComponents = {
  [CHART_TYPES.BAR]: BarChart,
  [CHART_TYPES.STACKED_BAR]: BarChart,
  [CHART_TYPES.LINE]: LineChart,
  [CHART_TYPES.AREA]: AreaChart,
  [CHART_TYPES.TABLE]: DataGridTable,
}

const ChartElements = {
  [CHART_TYPES.BAR]: Bar,
  [CHART_TYPES.STACKED_BAR]: Bar,
  [CHART_TYPES.LINE]: Line,
  [CHART_TYPES.AREA]: Area,
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
  metricHues,
  disableLegend,
}) => {
  const ChartComponent = ChartComponents[chartType]
  const ChartElement = ChartElements[chartType]

  return (
    <ResponsiveContainer height="100%" width="100%">
      {chartType === CHART_TYPES.TABLE ? (
        <DataGridTable
          columns={tableColumns}
          data={datasets}
          selectedItems={selectedMetrics}
        />
      ) : (
        <ChartComponent
          data={paginatedData}
          barCategoryGap={20}
          style={!datasets.length ? { pointerEvents: 'none' } : {}}
          padding={{ top: 0, right: 60, bottom: 0, left: 60 }}
        >
          {datasets.map((dataset) =>
            customChartDefs(
              dataset.metrics.map((m) => m.key),
              dataset.id,
              metricHues
            )
          )}
          <XAxis interval={0} dataKey={groupBy} />
          <YAxis />
          <Tooltip
            content={
              <CustomTooltip
                labels={datasets.map((ds) => ds.label)}
                generateColor={generateColorByMetric}
                formatMetric={humanReadableMetric}
                metricHues={metricHues}
              />
            }
            cursor="pointer"
          />
          {!disableLegend && (
            <Legend
              formatter={(value) => {
                const [metric, datasetId] = value.split('-')
                const currentDataset = datasets.find(
                  (ds) => ds.id === parseInt(datasetId, 10)
                )

                const datasetLabel = currentDataset.label

                const lastSelectedMetric = [...currentDataset.metrics]
                  .reverse()
                  .find((m) => selectedMetrics[m.key])

                if (lastSelectedMetric && metric === lastSelectedMetric.key) {
                  return `${humanReadableMetric(metric)} (${datasetLabel})`
                }

                return humanReadableMetric(metric)
              }}
              wrapperStyle={{
                wordWrap: 'break-word',
                maxWidth: '100%',
              }}
            />
          )}

          {datasets.map((dataset) =>
            dataset.metrics.map((metric) =>
              selectedMetrics[metric.key] ? (
                <ChartElement
                  key={`${metric.key}-${dataset.id}`}
                  type="monotone"
                  dataKey={`${metric.key}-${dataset.id}`}
                  fill={`url(#color${metric.key}-${dataset.id})`}
                  name={metric.name}
                  animationDuration={500}
                  stackId={
                    chartType === CHART_TYPES.STACKED_BAR ? 'a' : undefined
                  }
                  {...(chartType === 'area' && {
                    fillOpacity: 0.5,
                    stroke: 'transparent',
                  })}
                  {...(chartType === 'line' && {
                    strokeWidth: 3,
                    activeDot: {
                      r: 8,
                      fill: `url(#color${metric.key}-${dataset.id})`,
                      stroke: 'white',
                      strokeWidth: 2,
                    },
                    stroke: `url(#color${metric.key}-${dataset.id})`,
                  })}
                />
              ) : null
            )
          )}
        </ChartComponent>
      )}
    </ResponsiveContainer>
  )
}

ChartRenderer.propTypes = {
  chartType: PropTypes.oneOf(['bar', 'line', 'area', 'table', 'stackedBar'])
    .isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedMetrics: PropTypes.object.isRequired,
  customChartDefs: PropTypes.func.isRequired,
  paginatedData: PropTypes.arrayOf(PropTypes.object).isRequired,
  tableColumns: PropTypes.arrayOf(PropTypes.object),
  humanReadableMetric: PropTypes.func.isRequired,
  groupBy: PropTypes.string.isRequired,
  metricHues: PropTypes.objectOf(PropTypes.number).isRequired,
  disableLegend: PropTypes.bool,
}

ChartRenderer.defaultProps = {
  groupBy: 'NAME',
  disableLegend: false,
}
