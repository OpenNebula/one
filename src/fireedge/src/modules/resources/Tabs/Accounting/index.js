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
import { useState, useEffect, useCallback } from 'react'
import {
  MetricSelector,
  CustomizedChart,
} from '@modules/resources/Tabs/Accounting/components'
import AdapterLuxon from '@mui/lab/AdapterLuxon'
import { DateTime } from 'luxon'
import { LocalizationProvider } from '@mui/lab'
import {
  getDefaultDateRange,
  useAccountingData,
  calculateDisplayMetrics,
} from '@modules/resources/Tabs/Accounting/helpers'
import { filterDataset } from '@modules/resources/Charts/MultiChart/helpers/scripts'
import { AccountingTab, DateRangeFilter } from '@ComponentsV2Module'

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
    const { data, isLoading, error, refetch } = useAccountingData()
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

    const handleChartTypeChange = useCallback((newChartType) => {
      setChartType(newChartType)
    }, [])

    const handleGroupByChange = (newGroupBy) => {
      setGroupBy(newGroupBy)
    }

    return (
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <AccountingTab
          dateRangeFilter={
            <DateRangeFilter
              initialStartDate={dateRange.startDate}
              initialEndDate={dateRange.endDate}
              onDateChange={(updatedRange) => setDateRange(updatedRange)}
            />
          }
          metricSelector={
            chartType !== 'table' ? (
              <MetricSelector
                selectedItems={selectedMetrics}
                onChange={handleMetricChange}
              />
            ) : null
          }
          chart={
            <CustomizedChart
              datasets={datasets}
              visibleDatasets={visibleDatasets}
              chartType={chartType}
              selectedMetrics={selectedMetrics}
              error={error}
              isLoading={isLoading}
              groupBy={groupBy}
            />
          }
          datasets={datasets}
          visibleDatasets={visibleDatasets}
          groupBy={groupBy}
          chartType={chartType}
          onGroupByChange={handleGroupByChange}
          onChartTypeChange={handleChartTypeChange}
          onAddDataset={() => handleDatasetChange(ACTION_ADD)}
          onToggleDataset={toggleDatasetVisibility}
          onRemoveDataset={(dataset) =>
            handleDatasetChange(ACTION_REMOVE, dataset)
          }
          isLoading={isLoading}
          isDatasetLimitVisible={showTooltip}
        />
      </LocalizationProvider>
    )
  }

  AccountingInfoTab.propTypes = {
    id: PropTypes.string,
  }

  AccountingInfoTab.displayName = 'AccountingInfoTab'

  return AccountingInfoTab
}

export default generateAccountingInfoTab
