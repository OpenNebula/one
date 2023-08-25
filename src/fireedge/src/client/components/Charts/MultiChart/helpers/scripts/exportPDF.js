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
import ReactDOMServer from 'react-dom/server'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material'

import logo from 'client/assets/images/logo.png'

/**
 * Generates a printable PDF report from the provided data.
 *
 * @function
 * @param {Array<object>} data - The data to be exported to PDF.
 * @returns {Error} - Returns the error to the Exporter component to enqueue it.
 */
export const exportDataToPDF = (data) => {
  try {
    const rows = data.flatMap((item) => item.data)

    const tableComponent = (
      <Box
        style={{
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f9f9f9',
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{
            maxWidth: '150px',
            maxHeight: '50px',
            marginBottom: '10px',
            marginLeft: '0px',
          }}
        />

        <h2 style={{ textAlign: 'center', margin: '20px 0', color: '#333' }}>
          Data Report
        </h2>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(rows[0]).map((header) => (
                  <TableCell
                    key={header}
                    style={{
                      backgroundColor: '#f5f5f5',
                      fontWeight: 'bold',
                      color: '#555',
                      border: '1px solid #333',
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Object.values(row).map((value, valueIndex) => (
                    <TableCell
                      key={valueIndex}
                      style={{ color: '#666', border: '1px solid #333' }}
                    >
                      {String(value)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )

    const tableHTML = ReactDOMServer.renderToString(tableComponent)

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    iframe.contentDocument.write(
      '<html><head><title>Accounting Report</title></head><body>'
    )
    iframe.contentDocument.write(tableHTML)
    iframe.contentDocument.write('</body></html>')
    iframe.contentDocument.close()

    iframe.contentWindow.print()

    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  } catch (error) {
    return error
  }
}
