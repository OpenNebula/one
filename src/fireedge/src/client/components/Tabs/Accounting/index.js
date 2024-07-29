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
import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'iconoir-react'
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Button,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  MetricSelector,
  CustomizedChart,
} from 'client/components/Tabs/Accounting/components'
import { DateRangeFilter } from 'client/components/Date'
import AdapterLuxon from '@mui/lab/AdapterLuxon'
import { DateTime } from 'luxon'
import { LocalizationProvider } from '@mui/lab'
import {
  getDefaultDateRange,
  useAccountingData,
  calculateDisplayMetrics,
} from 'client/components/Tabs/Accounting/helpers'
import { filterDataset } from 'client/components/Charts/MultiChart/helpers/scripts'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const ACTION_ADD = 'add'
const ACTION_REMOVE = 'remove'
const DATASETS_LIMIT = 4

/**
 * Generates a QuotaInfoTab for an user or a group.
 * AccountingInfoTab component displays accounting information for a given ID.
 * It provides options to filter the data by date range, chart type, and grouping.
 *
 * @param {object} props - Input properties
 * @param {boolean} props.groups - If it's a group or not
 * @returns {object} - The AccountingInfoTab component
 */
const generateAccountingInfoTab = ({ groups }) => {
  const AccountingInfoTab = ({ id }) => {
    const [dateRange, setDateRange] = useState(getDefaultDateRange()) // LAST 7 DAYS
    const { data, isLoading, setIsLoading, error, refetch } = useAccountingData(
      {
        groups,
        id,
        start: dateRange.startDate.toSeconds(),
        end: dateRange.endDate.toSeconds(),
      }
    )
    const [datasets, setDatasets] = useState([])
    const [visibleDatasets, setVisibleDatasets] = useState([])
    const [chartType, setChartType] = useState('line')
    const [groupBy, setGroupBy] = useState('NAME')
    const [showTooltip, setShowTooltip] = useState(false)
    const [selectedMetrics, setSelectedMetrics] = useState({
      cpuHours: true,
      memoryGBHours: true,
      diskMBHours: true,
    })

    // Hook for the first time that the component is rendered
    useEffect(() => {
      // Make request to API
      const params = groups
        ? {
            group: id,
            start: dateRange.startDate.toSeconds(),
            end: dateRange.endDate.toSeconds(),
          }
        : {
            user: id,
            start: dateRange.startDate.toSeconds(),
            end: dateRange.endDate.toSeconds(),
          }
      refetch(params)
    }, [])

    // Hook to create data set each time a request is made
    useEffect(() => {
      if (!isLoading && data) {
        const newDataset = createDataset(data, dateRange, chartType)
        setDatasets((prevDatasets) => [...prevDatasets, newDataset])
        setVisibleDatasets((prevVisible) => [...prevVisible, newDataset.id])
      }
    }, [data, isLoading])

    const isWithinDateRange = (record, startDate, endDate) => {
      const recordDate = DateTime.fromSeconds(parseInt(record.STIME, 10))

      return recordDate >= startDate && recordDate <= endDate
    }

    // eslint-disable-next-line no-shadow
    const createDataset = (data, dateRange) => {
      const result = filterDataset(
        data,
        (record) =>
          isWithinDateRange(record, dateRange.startDate, dateRange.endDate),
        (record) =>
          `${dateRange.startDate.toFormat(
            'MMM dd, yyyy'
          )} - ${dateRange.endDate.toFormat('MMM dd, yyyy')}`
      )

      const filteredDataset = result.dataset
      let filteredData =
        filteredDataset && filteredDataset.data ? filteredDataset.data : []

      filteredData.sort((a, b) => {
        if (a.ETIME === '0') return 1
        if (b.ETIME === '0') return -1

        return b.ETIME - a.ETIME
      })

      const seenIds = new Set()
      filteredData = filteredData.filter((record) => {
        if (seenIds.has(record.ID)) {
          return false
        }
        seenIds.add(record.ID)

        return true
      })

      const metrics = calculateDisplayMetrics(filteredData)
      const label = `${dateRange.startDate.toFormat(
        'MMM dd, yyyy'
      )} - ${dateRange.endDate.toFormat('MMM dd, yyyy')}`

      return {
        id: Date.now(),
        data: filteredData,
        metrics: metrics,
        label: label,
        isEmpty: result.isEmpty,
      }
    }

    // Event handlers

    const toggleDatasetVisibility = (datasetId) => {
      setVisibleDatasets((prevVisible) => {
        if (prevVisible.includes(datasetId)) {
          // eslint-disable-next-line no-shadow
          return prevVisible.filter((id) => id !== datasetId)
        } else {
          return [...prevVisible, datasetId]
        }
      })
    }

    /**
     * Add or remove datasets.
     *
     * @param {string} action - Add or remove action
     * @param {object} datasetToRemove - Dataset to remove
     * @returns {void} - Nothing
     */
    const handleDatasetChange = (action, datasetToRemove = null) => {
      // Add case - Check if there are less datasets that DATASETS_LIMIT and, if not,  make a request to the API to get data
      if (action === ACTION_ADD) {
        // Check number of datasets
        if (datasets.length >= DATASETS_LIMIT) {
          setShowTooltip(true)
          setTimeout(() => setShowTooltip(false), 3000)

          return
        }

        // Active loading
        setIsLoading(true)

        // Make request to API
        const params = groups
          ? {
              group: id,
              start: dateRange.startDate.toSeconds(),
              end: dateRange.endDate.toSeconds(),
            }
          : {
              user: id,
              start: dateRange.startDate.toSeconds(),
              end: dateRange.endDate.toSeconds(),
            }
        refetch(params)
      }
      // Remove case
      else if (action === ACTION_REMOVE && datasetToRemove) {
        setDatasets((prevDatasets) =>
          prevDatasets.filter((dataset) => dataset.id !== datasetToRemove.id)
        )

        setVisibleDatasets((prevVisible) =>
          // eslint-disable-next-line no-shadow
          prevVisible.filter((id) => id !== datasetToRemove.id)
        )
      }
    }

    const handleMetricChange = useCallback((event) => {
      const { name, checked } = event.target
      setSelectedMetrics((prevMetrics) => ({
        ...prevMetrics,
        [name]: checked,
      }))
    }, [])

    const handleChartTypeChange = useCallback(
      (event) => {
        const newChartType = event.target.value
        setChartType(newChartType)
      },
      [data, dateRange]
    )

    const handleGroupByChange = (event) => {
      setGroupBy(event.target.value)
    }

    return (
      <Box padding={5}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <Box
            display="flex"
            alignItems="center"
            marginBottom={3}
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <DateRangeFilter
                initialStartDate={dateRange.startDate}
                initialEndDate={dateRange.endDate}
                onDateChange={(updatedRange) => setDateRange(updatedRange)}
              />
              <Tooltip
                title={`Maximum of ${DATASETS_LIMIT} datasets allowed!`}
                open={showTooltip}
                placement="right"
                PopperProps={{
                  style: { zIndex: 9999 },
                }}
                arrow
              >
                <Button
                  variant="contained"
                  onClick={() => handleDatasetChange('add')}
                  disabled={isLoading}
                >
                  <Plus />
                </Button>
              </Tooltip>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl
                variant="outlined"
                size="small"
                style={{ marginRight: 2, minWidth: 120 }}
              >
                <InputLabel>{Tr(T.GroupBy)}</InputLabel>
                <Select
                  value={groupBy}
                  onChange={handleGroupByChange}
                  label={Tr(T.GroupBy)}
                >
                  <MenuItem value="NAME">{Tr(T.VM)}</MenuItem>
                  <MenuItem value="UNAME">{Tr(T.User)}</MenuItem>
                  <MenuItem value="GNAME">{Tr(T.Group)}</MenuItem>
                </Select>
              </FormControl>
              <FormControl
                variant="outlined"
                size="small"
                style={{ marginRight: 2, minWidth: 120 }}
              >
                <InputLabel>{Tr(T.ChartType)}</InputLabel>
                <Select
                  value={chartType}
                  onChange={handleChartTypeChange}
                  label={Tr(T.ChartType)}
                >
                  <MenuItem value="line">{Tr(T.LineChart)}</MenuItem>
                  <MenuItem value="bar">{Tr(T.BarChart)}</MenuItem>
                  <MenuItem value="area">{Tr(T.AreaChart)}</MenuItem>
                  <MenuItem value="table">{Tr(T.TableChart)}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          {chartType !== 'table' && (
            <MetricSelector
              selectedItems={selectedMetrics}
              onChange={handleMetricChange}
            />
          )}
          <Box
            display="flex"
            flexWrap="wrap"
            gap={2}
            marginBottom={3}
            justifyContent="center"
            alignItems="center"
          >
            {datasets.map((dataset) => (
              <Chip
                key={dataset.id}
                label={dataset.label}
                clickable
                onClick={() => toggleDatasetVisibility(dataset.id)}
                onDelete={(e) => {
                  e.stopPropagation()
                  handleDatasetChange('remove', dataset)
                }}
                style={{
                  opacity: visibleDatasets.includes(dataset.id) ? 1 : 0.5,
                }}
              />
            ))}
          </Box>
          <CustomizedChart
            datasets={datasets}
            visibleDatasets={visibleDatasets}
            chartType={chartType}
            selectedMetrics={selectedMetrics}
            error={error}
            isLoading={isLoading}
            groupBy={groupBy}
          />
        </LocalizationProvider>
      </Box>
    )
  }

  AccountingInfoTab.propTypes = {
    id: PropTypes.string,
  }

  AccountingInfoTab.displayName = 'AccountingInfoTab'

  return AccountingInfoTab
}

export default generateAccountingInfoTab
