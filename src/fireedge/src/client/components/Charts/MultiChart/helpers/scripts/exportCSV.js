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
import Papa from 'papaparse'

/**
 * Exports the provided data as a CSV file.
 *
 * @function
 * @param {Array<object>} data - An array of datasets containing data to be exported.
 * @returns {Error} - Returns the error to the Exporter component to enqueue it.
 */
export const exportDataToCSV = (data) => {
  try {
    const csvData = data.flatMap((item) => item.data)

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute(
      'download',
      data[0]?.label
        ? `${data[0].label.replace(/ /g, '')}_report.csv`
        : 'one_report.csv'
    )
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (error) {
    return error
  }
}
