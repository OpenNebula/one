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
import PropTypes from 'prop-types'
import { Component, forwardRef, useMemo } from 'react'
import { Box, Chip } from '@mui/material'
import { Plus } from 'iconoir-react'

import { T } from '@ConstantsModule'
import { Dropdown } from '@modules/componentsv2/primitives/Dropdown'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip'
import { getStyles } from '@modules/componentsv2/composed/Panels/Accounting/styles'

const GROUP_BY_OPTIONS = [
  { text: T.VM, value: 'NAME' },
  { text: T.User, value: 'UNAME' },
  { text: T.Group, value: 'GNAME' },
]

const CHART_TYPE_OPTIONS = [
  { text: T.LineChart, value: 'line' },
  { text: T.BarChart, value: 'bar' },
  { text: T.AreaChart, value: 'area' },
  { text: T.TableChart, value: 'table' },
]

const findOption = (options, value) =>
  options.find((option) => option.value === value) ?? null

/**
 * Displays accounting controls and chart content using the Components V2 design system.
 *
 * @param {object} props - Component props
 * @param {object} props.dateRangeFilter - Date range filter node
 * @param {object} props.metricSelector - Metric selector node
 * @param {object} props.chart - Chart node
 * @param {Array} props.datasets - Dataset chips
 * @param {Array} props.visibleDatasets - Visible dataset IDs
 * @param {string} props.groupBy - Current group by value
 * @param {string} props.chartType - Current chart type
 * @param {Function} props.onGroupByChange - Group by change handler
 * @param {Function} props.onChartTypeChange - Chart type change handler
 * @param {Function} props.onAddDataset - Add dataset handler
 * @param {Function} props.onToggleDataset - Toggle dataset handler
 * @param {Function} props.onRemoveDataset - Remove dataset handler
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isDatasetLimitVisible - Show dataset limit tooltip
 * @param {object} ref - Forwarded ref
 * @returns {Component} Accounting tab
 */
export const AccountingTab = forwardRef(
  (
    {
      dateRangeFilter,
      metricSelector,
      chart,
      datasets = [],
      visibleDatasets = [],
      groupBy = 'NAME',
      chartType = 'line',
      onGroupByChange,
      onChartTypeChange,
      onAddDataset,
      onToggleDataset,
      onRemoveDataset,
      isLoading = false,
      isDatasetLimitVisible = false,
    },
    ref
  ) => {
    const selectedGroupBy = useMemo(
      () => findOption(GROUP_BY_OPTIONS, groupBy),
      [groupBy]
    )
    const selectedChartType = useMemo(
      () => findOption(CHART_TYPE_OPTIONS, chartType),
      [chartType]
    )

    return (
      <Box sx={(theme) => getStyles({ theme })} ref={ref}>
        <Box className="accounting-toolbar">
          <Box className="accounting-toolbar-group">
            {dateRangeFilter}
            <Tooltip
              title="Maximum of 4 datasets allowed!"
              open={isDatasetLimitVisible}
              placement="right"
              arrow
            >
              <span className="accounting-add-dataset-action">
                <Button
                  type="primary"
                  onClick={onAddDataset}
                  isDisabled={isLoading}
                  iconOnly={<Plus width="16px" height="16px" />}
                />
              </span>
            </Tooltip>
          </Box>

          <Box className="accounting-toolbar-group">
            <Box className="accounting-select">
              <Dropdown
                key={groupBy}
                label={T.GroupBy}
                initialValue={selectedGroupBy}
                isMultipleSelectable={false}
                options={GROUP_BY_OPTIONS}
                onChange={(option) =>
                  onGroupByChange?.(option?.value ?? option)
                }
              />
            </Box>
            <Box className="accounting-select">
              <Dropdown
                key={chartType}
                label={T.ChartType}
                initialValue={selectedChartType}
                isMultipleSelectable={false}
                options={CHART_TYPE_OPTIONS}
                onChange={(option) =>
                  onChartTypeChange?.(option?.value ?? option)
                }
              />
            </Box>
          </Box>
        </Box>

        {metricSelector && (
          <Box className="accounting-metrics">{metricSelector}</Box>
        )}

        <Box className="accounting-datasets">
          {datasets.map((dataset) => (
            <Chip
              key={dataset.id}
              className="accounting-dataset-chip"
              label={dataset.label}
              clickable
              onClick={() => onToggleDataset?.(dataset.id)}
              onDelete={(event) => {
                event.stopPropagation()
                onRemoveDataset?.(dataset)
              }}
              sx={{ opacity: visibleDatasets.includes(dataset.id) ? 1 : 0.5 }}
            />
          ))}
        </Box>

        <Box className="accounting-chart">{chart}</Box>
      </Box>
    )
  }
)

AccountingTab.propTypes = {
  dateRangeFilter: PropTypes.node,
  metricSelector: PropTypes.node,
  chart: PropTypes.node,
  datasets: PropTypes.arrayOf(PropTypes.object),
  visibleDatasets: PropTypes.arrayOf(PropTypes.number),
  groupBy: PropTypes.string,
  chartType: PropTypes.string,
  onGroupByChange: PropTypes.func,
  onChartTypeChange: PropTypes.func,
  onAddDataset: PropTypes.func,
  onToggleDataset: PropTypes.func,
  onRemoveDataset: PropTypes.func,
  isLoading: PropTypes.bool,
  isDatasetLimitVisible: PropTypes.bool,
}

AccountingTab.displayName = 'AccountingTab'
