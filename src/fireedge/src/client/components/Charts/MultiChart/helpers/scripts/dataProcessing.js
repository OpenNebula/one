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
/**
 * Processes data for rendering on a chart.
 *
 * This function restructures the input data. For each unique grouping attribute,
 * it creates an object that sums metric values across all datasets. If a dataset doesn't have
 * a metric value for a particular group, it defaults to 0.
 *
 * @function
 * @param {Array<string>} uniqueGroups - An array of unique groups representing different data points or entities.
 * @param {Array<object>} datasets - An array of datasets.
 * @param {Array<number>} visibleDatasetIDs - An array of dataset ID's to display.
 * @param {string} groupBy - The attribute by which data should be grouped (e.g., 'NAME', 'OID').
 * @returns {Array<object>} An array of processed data items, each structured with properties for every metric from every dataset.
 */
import _ from 'lodash'

/**
 * @param {Array} uniqueGroups - Groups to sort by
 * @param {Array} datasets - All datasets in pool
 * @param {Array} visibleDatasetIDs - Dataset ID's to render
 * @param {string} groupBy - Group data by key
 * @returns {object} - Processed dataset
 */
export const processDataForChart = (
  uniqueGroups,
  datasets,
  visibleDatasetIDs,
  groupBy
) => {
  const visibleDatasets = datasets.filter((dataset) =>
    visibleDatasetIDs.includes(dataset.id)
  )

  return uniqueGroups.map((group) => {
    const item = { [groupBy]: group }
    visibleDatasets.forEach((dataset) => {
      const matchingItem = dataset.data.find((d) => d[groupBy] === group)
      dataset.metrics.forEach((metric) => {
        item[`${metric.key}-${dataset.id}`] = matchingItem
          ? matchingItem[metric.key]
          : 0
      })
    })

    return item
  })
}

/**
 * Recursively searches for the first array of objects in the given object.
 * Used with all pool-like API requests to find the data array dynamically.
 *
 * @param {object} obj - The object to search within.
 * @param {number} depth - The current depth of recursion.
 * @param {number} maxDepth - The maximum depth to recurse to.
 * @returns {Array} - The found array or empty if not found.
 */
const findFirstArray = (obj, depth = 0, maxDepth = Infinity) => {
  if (depth >= maxDepth) {
    return []
  }

  for (const value of Object.values(obj)) {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === 'object'
    ) {
      return value
    }

    if (typeof value === 'object') {
      const result = findFirstArray(value, depth + 1, maxDepth)
      if (result.length > 0) {
        return result
      }
    }
  }

  return []
}

/**
 * Transforms the API response into the desired dataset format.
 *
 * @param {object} apiResponse - The API response to process.
 * @param {object} keyMap - An object that maps the keys in the API response to the desired output keys.
 * @param {Array} metricKeys - An array of keys to aggregate for the metrics.
 * @param {Function} labelingFunction - A function to generate the label for the dataset.
 * @param {number} depth - Depth of recursion when finding data array.
 * @param {string} dataArrayPath - Path to data array in API response
 * @returns {object} - The transformed dataset.
 */
export const transformApiResponseToDataset = (
  apiResponse,
  keyMap,
  metricKeys,
  labelingFunction,
  depth = 0,
  dataArrayPath
) => {
  const dataArray =
    (_.isEmpty(apiResponse)
      ? []
      : dataArrayPath
      ? _.get(apiResponse, dataArrayPath)
      : findFirstArray(apiResponse, depth)) ?? []

  const flattenObject = (obj, prefix = '') =>
    Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : ''
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        if (Array.isArray(obj[k])) {
          if (obj[k].length > 0 && typeof obj[k][0] === 'object') {
            obj[k].forEach((item, _index) => {
              Object.assign(acc, flattenObject(item, pre + k))
            })
          } else {
            acc[pre + k] = obj[k]
          }
        } else {
          Object.assign(acc, flattenObject(obj[k], pre + k))
        }
      } else {
        acc[pre + k] = obj[k]
      }

      return acc
    }, {})

  const transformedRecords = dataArray.map((record) => {
    const flattenedRecord = flattenObject(record)
    const transformedRecord = {}
    Object.keys(keyMap).forEach((key) => {
      transformedRecord[keyMap[key]] = flattenedRecord[key]
    })

    return transformedRecord
  })

  const metrics = metricKeys.map((key) => {
    const total = transformedRecords.reduce(
      (acc, record) => acc + parseFloat(record[key] || 0),
      0
    )

    return { key: key, value: total }
  })

  let label = 'N/A'
  let error = null
  const isEmpty = transformedRecords?.length === 0

  if (!isEmpty && labelingFunction) {
    try {
      label = labelingFunction(transformedRecords[0])
    } catch (err) {
      error = `Error applying label to dataset: ${err.message}`
    }
  }

  return {
    dataset: {
      id: generateDatasetId({
        data: transformedRecords,
        metrics: metrics,
        label: label,
      }),
      data: transformedRecords,
      metrics: metrics,
      label: label,
    },
    error: error,
    isEmpty: isEmpty,
  }
}

/**
 * Filters a processed dataset based on a custom filter function and recalculates the label.
 *
 * @param {object} dataset - The processed dataset.
 * @param {Function} filterFn - A custom function that determines which records to include.
 * @param {Function} labelingFunction - A function to generate the label for the subset.
 * @returns {object} - A subset of the dataset with a recalculated label.
 */
export const filterDataset = (dataset, filterFn, labelingFunction) => {
  const { data, metrics } = dataset

  const filteredData = data.filter(filterFn)
  const isEmpty = filteredData.length === 0

  const filteredMetrics = metrics.map((metric) => {
    const total = filteredData.reduce(
      (acc, record) => acc + parseFloat(record[metric.key] || 0),
      0
    )

    return { key: metric.key, value: total }
  })

  let label = 'N/A'
  let error = null

  if (labelingFunction && !isEmpty) {
    try {
      label = labelingFunction(filteredData[0])
    } catch (err) {
      error = `Error applying label to dataset: ${err.message}`
    }
  }

  return {
    dataset: {
      id: generateDatasetId({
        data: filteredData,
        metrics: filteredMetrics,
        label: label,
      }),
      data: filteredData,
      metrics: filteredMetrics,
      label: label,
    },
    error: error,
    isEmpty: isEmpty,
  }
}

const generateDatasetId = (dataset) => {
  const dataLength = dataset.data.length
  if (dataLength === 0) return generateChecksum('empty')

  const firstRecord = JSON.stringify(dataset.data[0])
  const middleRecord = JSON.stringify(dataset.data[Math.floor(dataLength / 2)])
  const lastRecord = JSON.stringify(dataset.data[dataLength - 1])

  const combinedString = firstRecord + middleRecord + lastRecord + dataLength // This will not collide

  return generateChecksum(combinedString)
}

const generateChecksum = (input) => {
  let sum = 0
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i)
  }

  return sum * 1327 // Random prime number
}
