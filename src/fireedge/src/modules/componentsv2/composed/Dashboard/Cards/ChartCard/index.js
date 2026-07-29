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
import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, forwardRef, useMemo } from 'react'

import { Graph } from '@modules/componentsv2/composed/Charts'
import { DashboardCard } from '@modules/componentsv2/composed/Dashboard/Card'
import { getStyles } from '@modules/componentsv2/composed/Dashboard/Cards/ChartCard/styles'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { T } from '@ConstantsModule'

const DEFAULT_CHART_HEIGHT = { xs: 220, sm: 280 }
const GRID_ORIENTATIONS = ['horizontal', 'vertical', 'both']

/**
 * Dashboard card that displays a responsive time-series graph.
 *
 * Each series maps one property from every data point to a configurable line.
 * This contract supports the CPU, memory, disk, network and host monitoring
 * graphs used by the legacy Cloud dashboard.
 *
 * @param {object} props - Component properties
 * @param {Component} props.title - Card title
 * @param {Component} props.titleTag - Tag rendered next to the title
 * @param {Component} props.adornment - Element rendered next to the title
 * @param {object[]} props.data - Graph data points
 * @param {object[]} props.series - Graph series definitions
 * @param {string|Function|Array} props.x - X value or accessor
 * @param {Function} props.valueFormatter - Y-axis and tooltip formatter
 * @param {boolean} props.showGrid - Whether to display the graph grid lines
 * @param {'horizontal'|'vertical'|'both'} props.gridOrientation - Grid line orientation
 * @param {string} props.gridColor - Graph grid line color
 * @param {number} props.gridWidth - Graph grid line width
 * @param {string} props.tickColor - Axis tick color
 * @param {string} props.axisColor - Axis label color
 * @param {boolean} props.showXAxisTicks - Whether to display the X-axis tick marks
 * @param {boolean} props.fitGraphWidth - Whether the graph uses the full card width
 * @param {boolean} props.useMilliseconds - Whether timestamps use milliseconds
 * @param {boolean} props.showLegend - Whether to display the graph legend
 * @param {boolean} props.sortX - Whether to sort timestamps
 * @param {boolean} props.derivative - Whether to graph value deltas per second
 * @param {number} props.zoomFactor - Wheel zoom factor
 * @param {number} props.clusterFactor - Points combined in each large-data cluster
 * @param {number} props.clusterThreshold - Point count that enables clustering
 * @param {string} props.dateFormat - X-axis date format
 * @param {string} props.dateFormatHover - Tooltip date format
 * @param {number|string|object} props.height - Responsive graph height
 * @param {boolean} props.isLoading - Whether graph data is loading
 * @param {string} props.loadingLabel - Accessible loading description
 * @param {string|object} props.to - Optional internal navigation target
 * @param {string} props.className - Additional card class name
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard chart card
 */
export const DashboardChartCard = forwardRef(
  (
    {
      title,
      titleTag,
      adornment,
      data = [],
      series = [],
      x,
      valueFormatter,
      showGrid = true,
      gridOrientation = 'horizontal',
      gridColor,
      gridWidth = 2,
      tickColor,
      axisColor,
      showXAxisTicks = false,
      fitGraphWidth = true,
      useMilliseconds = true,
      showLegend,
      sortX = true,
      derivative = false,
      zoomFactor = 0.95,
      clusterFactor = 10,
      clusterThreshold = 10000,
      dateFormat = 'MM-dd HH:mm',
      dateFormatHover = 'MMM dd HH:mm:ss',
      height = DEFAULT_CHART_HEIGHT,
      isLoading = false,
      loadingLabel = T.Loading,
      to,
      className = '',
    },
    ref
  ) => {
    const theme = useTheme()
    const graphSeries = useMemo(
      () => series.filter(({ dataKey }) => dataKey),
      [series]
    )
    const dataKeys = graphSeries.map(({ dataKey }) => dataKey)
    const legendNames = graphSeries.map(
      ({ dataKey, label }) => label ?? dataKey
    )
    const lineColors = graphSeries.map(
      ({ color }) => color ?? theme.palette.primary.main
    )
    const filledSeries = graphSeries
      .filter(({ fill }) => fill)
      .map(({ dataKey }) => dataKey)
    const hasLegend = showLegend ?? graphSeries.length > 1

    return (
      <DashboardCard
        ref={ref}
        type="big"
        title={title}
        titleTag={titleTag}
        adornment={adornment}
        to={to}
        className={`dashboard-chart-card ${className}`}
      >
        <Box
          className="dashboard-chart-card-content"
          aria-busy={isLoading}
          sx={(currentTheme) => getStyles({ theme: currentTheme })}
        >
          <SkeletonLoading
            loading={isLoading}
            width="100%"
            height={height}
            borderRadius="lg"
            ariaLabel={loadingLabel}
            className="dashboard-chart-card-skeleton"
          >
            <Graph
              className="dashboard-chart-card-graph"
              name={typeof title === 'string' ? title : ''}
              data={graphSeries.length ? data : []}
              filter={dataKeys}
              x={x}
              y={dataKeys}
              legendNames={legendNames}
              lineColors={lineColors}
              shouldFill={filledSeries}
              interpolationY={valueFormatter}
              showGrid={showGrid}
              gridOrientation={gridOrientation}
              gridColor={gridColor ?? theme.palette.graphs.grid}
              gridWidth={gridWidth}
              tickColor={tickColor ?? theme.palette.graphs.grid}
              axisColor={axisColor ?? theme.palette.graphs.legend}
              showXAxisTicks={showXAxisTicks}
              fitWidth={fitGraphWidth}
              useMilliseconds={useMilliseconds}
              showLegends={hasLegend}
              sortX={sortX}
              derivative={derivative}
              zoomFactor={zoomFactor}
              clusterFactor={clusterFactor}
              clusterThreshold={clusterThreshold}
              dateFormat={dateFormat}
              dateFormatHover={dateFormatHover}
              height={height}
            />
          </SkeletonLoading>
        </Box>
      </DashboardCard>
    )
  }
)

DashboardChartCard.propTypes = {
  title: PropTypes.node.isRequired,
  titleTag: PropTypes.node,
  adornment: PropTypes.node,
  data: PropTypes.arrayOf(PropTypes.object),
  series: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      label: PropTypes.string,
      color: PropTypes.string,
      fill: PropTypes.bool,
    })
  ).isRequired,
  x: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.func])),
  ]).isRequired,
  valueFormatter: PropTypes.func,
  showGrid: PropTypes.bool,
  gridOrientation: PropTypes.oneOf(GRID_ORIENTATIONS),
  gridColor: PropTypes.string,
  gridWidth: PropTypes.number,
  tickColor: PropTypes.string,
  axisColor: PropTypes.string,
  showXAxisTicks: PropTypes.bool,
  fitGraphWidth: PropTypes.bool,
  useMilliseconds: PropTypes.bool,
  showLegend: PropTypes.bool,
  sortX: PropTypes.bool,
  derivative: PropTypes.bool,
  zoomFactor: PropTypes.number,
  clusterFactor: PropTypes.number,
  clusterThreshold: PropTypes.number,
  dateFormat: PropTypes.string,
  dateFormatHover: PropTypes.string,
  height: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.object,
  ]),
  isLoading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
}

DashboardChartCard.displayName = 'DashboardChartCard'
