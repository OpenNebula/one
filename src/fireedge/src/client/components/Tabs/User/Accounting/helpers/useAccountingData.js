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
import { useState, useEffect } from 'react'
import { useGetAccountingPoolQuery } from 'client/features/OneApi/vm'
import { transformWithComputedMetrics } from 'client/components/Tabs/User/Accounting/helpers'

const keyMap = {
  'VM.ID': 'ID',
  'VM.NAME': 'NAME',
  'VM.UNAME': 'UNAME',
  'VM.GNAME': 'GNAME',
  'VM.STIME': 'STIME',
  'VM.ETIME': 'ETIME',
  'VM.TEMPLATE.CPU': 'CPU',
  'VM.TEMPLATE.MEMORY': 'MEMORY',
  'VM.TEMPLATE.DISK_COST': 'DISK_COST',
}

const metricKeys = ['cpuHours', 'memoryGBHours', 'diskMBHours']

const TIMEOUT = 8000 // 8 seconds

/**
 * Hook to fetch and process accounting data.
 *
 * @param {number|string} id - The ID for which accounting data is to be fetched.
 * @returns {object} - Returns an object containing the processed data, loading state, and any error.
 */
export const useAccountingData = ({ id }) => {
  const { data: fetchedData } = useGetAccountingPoolQuery({ filter: id })
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const labelingFunction = (record) => record.DATE

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setError('Failed to fetch data in time')
      setIsLoading(false)
    }, TIMEOUT)

    const pollingIntervalId = setInterval(() => {
      if (fetchedData && typeof fetchedData === 'object') {
        const result = transformWithComputedMetrics(
          fetchedData,
          keyMap,
          metricKeys,
          labelingFunction
        )

        if (result.error) {
          setError(result.error)
          setIsLoading(false)
        } else {
          setData(result.dataset)
          setIsLoading(false)
        }

        clearTimeout(timeoutId)
        clearInterval(pollingIntervalId)
      }
    }, 1000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(pollingIntervalId)
    }
  }, [fetchedData])

  return { data, isLoading, error }
}
