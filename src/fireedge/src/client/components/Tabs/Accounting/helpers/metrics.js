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
import { transformApiResponseToDataset } from 'client/components/Charts/MultiChart/helpers/scripts'

/**
 * Computes metrics for a given record.
 *
 * @param {object} record - The record containing data to compute metrics from.
 * @returns {object} - Returns an object containing computed metrics such as cpuHours, memoryGBHours, and diskMBHours.
 */
export const computeMetrics = (record) => {
  const currentTime = Math.floor(Date.now() / 1000)
  const startTime = parseInt(record.STIME, 10)
  const endTime = parseInt(record.ETIME, 10) || currentTime
  const hoursRunning = (endTime - startTime) / 3600

  const cpu = parseFloat(record.CPU)
  const memory = parseFloat(record.MEMORY)
  const disk = parseFloat(record.DISK_COST)

  const cpuHours = (isNaN(cpu) ? 0 : cpu) * hoursRunning
  const memoryGBHours = (isNaN(memory) ? 0 : memory / 1024) * hoursRunning
  const diskMBHours = (isNaN(disk) ? 0 : disk) * hoursRunning

  return {
    cpuHours,
    memoryGBHours,
    diskMBHours,
  }
}

/**
 * Transforms the API response by computing metrics and aggregating them.
 *
 * @param {object} apiResponse - The API response to process.
 * @param {object} keyMap - An object that maps the keys in the API response to the desired output keys.
 * @param {Array} metricKeys - An array of keys to aggregate for the metrics.
 * @param {Function} labelingFunction - A function to generate the label for the dataset.
 * @returns {object} - The transformed dataset.
 */
export const transformWithComputedMetrics = (
  apiResponse,
  keyMap,
  metricKeys,
  labelingFunction
) => {
  const transformedResult = transformApiResponseToDataset(
    apiResponse,
    keyMap,
    metricKeys,
    labelingFunction
  )

  if (transformedResult.error) {
    return { error: transformedResult.error }
  }

  const transformedData = transformedResult.dataset
  const aggregatedMetrics = {}

  transformedData.data.forEach((record) => {
    const metrics = computeMetrics(record)
    for (const metricKey of metricKeys) {
      if (!aggregatedMetrics[record.NAME]) {
        aggregatedMetrics[record.NAME] = {}
      }
      aggregatedMetrics[record.NAME][metricKey] =
        (aggregatedMetrics[record.NAME][metricKey] || 0) + metrics[metricKey]
      record[metricKey] = aggregatedMetrics[record.NAME][metricKey]
    }
  })

  transformedData.metrics = metricKeys.map((key) => {
    const total = transformedData.data.reduce(
      (acc, record) => acc + parseFloat(record[key] || 0),
      0
    )

    return { key: key, value: total }
  })

  return { dataset: transformedData }
}

/**
 * Calculate display metrics for the given data.
 *
 * @param {Array} data - The data to derive metrics from.
 * @returns {Array} - The calculated metrics as an array of metric objects.
 */
export const calculateDisplayMetrics = (data) => {
  let totalCpuHours = 0
  let totalMemoryGBHours = 0
  let totalDiskMBHours = 0

  data.forEach((record) => {
    totalCpuHours += record.cpuHours
    totalMemoryGBHours += record.memoryGBHours
    totalDiskMBHours += record.diskMBHours
  })

  return [
    {
      key: 'cpuHours',
      value: totalCpuHours,
    },
    {
      key: 'memoryGBHours',
      value: totalMemoryGBHours,
    },
    {
      key: 'diskMBHours',
      value: totalDiskMBHours,
    },
  ]
}
