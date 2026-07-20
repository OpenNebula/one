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
import { useCallback, useState } from 'react'
import { VmAPI } from '@FeaturesModule'
import { transformWithComputedMetrics } from '@modules/resources/Tabs/Accounting/helpers'
import { T } from '@ConstantsModule'

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
const TIMEOUT = 8000
const TIMEOUT_RESULT = Symbol('timeout')

const getErrorMessage = (error) => {
  if (typeof error === 'string') return error

  const message = error?.data?.message ?? error?.error ?? error?.message

  return typeof message === 'string' ? message : JSON.stringify(error)
}

/**
 * Hook to fetch and process accounting data.
 *
 * @returns {object} - Returns an object containing the processed data, loading state, and any error.
 */
export const useAccountingData = () => {
  const [getAccounting] = VmAPI.useLazyGetAccountingPoolFilteredQuery()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const labelingFunction = (record) => record.DATE

  const refetch = useCallback(
    async (params) => {
      setData(null)
      setError(null)
      setIsLoading(true)

      const request = getAccounting(params)
      let timeoutId

      try {
        const fetchedData = await Promise.race([
          request.unwrap(),
          new Promise((resolve) => {
            timeoutId = setTimeout(() => resolve(TIMEOUT_RESULT), TIMEOUT)
          }),
        ])

        if (fetchedData === TIMEOUT_RESULT) {
          request.abort()
          throw T.Timeout
        }

        const result = transformWithComputedMetrics(
          fetchedData,
          keyMap,
          metricKeys,
          labelingFunction
        )

        if (result.error) {
          setError(result.error)

          return
        }

        setData(result.dataset)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        clearTimeout(timeoutId)
        setIsLoading(false)
      }
    },
    [getAccounting]
  )

  return { data, isLoading, error, refetch }
}
