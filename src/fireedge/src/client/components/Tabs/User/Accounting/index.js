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
import { Component, useState, useEffect, useCallback } from 'react'
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
} from 'client/components/Tabs/User/Accounting/components'
import { DateRangeFilter } from 'client/components/Date'
import AdapterLuxon from '@mui/lab/AdapterLuxon'
import { DateTime } from 'luxon'
import { LocalizationProvider } from '@mui/lab'
import {
  getDefaultDateRange,
  useAccountingData,
  calculateDisplayMetrics,
} from 'client/components/Tabs/User/Accounting/helpers'
import { filterDataset } from 'client/components/Charts/MultiChart/helpers/scripts'

const ACTION_ADD = 'add'
const ACTION_REMOVE = 'remove'
const DATASETS_LIMIT = 4

/**
 * AccountingInfoTab component displays accounting information for a given ID.
 * It provides options to filter the data by date range, chart type, and grouping.
 *
 * @param {object} props - Component properties.
 * @param {string} props.id - The ID for which accounting information is to be displayed.
 * @returns {Component} Rendered AccountingInfoTab component.
 */
const AccountingInfoTab = ({ id }) => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange()) // LAST 7 DAYS
  const { data, isLoading, error } = useAccountingData(id)
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

  useEffect(() => {
    if (!isLoading && data) {
      const defaultDataset = createDataset(data, dateRange, chartType)
      setDatasets([defaultDataset])
      setVisibleDatasets([defaultDataset.id])
    }
  }, [isLoading])

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

  const handleDatasetChange = useCallback(
    (action, datasetToRemove = null) => {
      if (action === ACTION_ADD) {
        if (datasets.length >= DATASETS_LIMIT) {
          setShowTooltip(true)
          setTimeout(() => setShowTooltip(false), 3000)

          return
        }
        const newDataset = createDataset(data, dateRange)
        setDatasets((prevDatasets) => [...prevDatasets, newDataset])

        setVisibleDatasets((prevVisible) => [...prevVisible, newDataset.id])
      } else if (action === ACTION_REMOVE && datasetToRemove) {
        setDatasets((prevDatasets) =>
          prevDatasets.filter((dataset) => dataset.id !== datasetToRemove.id)
        )

        setVisibleDatasets((prevVisible) =>
          // eslint-disable-next-line no-shadow
          prevVisible.filter((id) => id !== datasetToRemove.id)
        )
      }
    },
    [datasets, data, dateRange]
  )

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
              <InputLabel>Group By</InputLabel>
              <Select
                value={groupBy}
                onChange={handleGroupByChange}
                label="Group By"
              >
                <MenuItem value="NAME">VM</MenuItem>
                <MenuItem value="UNAME">User</MenuItem>
                <MenuItem value="GNAME">Group</MenuItem>
              </Select>
            </FormControl>
            <FormControl
              variant="outlined"
              size="small"
              style={{ marginRight: 2, minWidth: 120 }}
            >
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                onChange={handleChartTypeChange}
                label="Chart Type"
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="table">Table Chart</MenuItem>
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

export default AccountingInfoTab
