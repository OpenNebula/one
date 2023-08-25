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
import React from 'react'
import PropTypes from 'prop-types'
import { DataGrid } from '@mui/x-data-grid'
import { Box } from '@mui/material'

/**
 * Renders a data grid table using the provided data and columns.
 *
 * @param {object} props - The properties for the component.
 * @param {Array} props.data - The data to be displayed in the table.
 * @param {Array} props.columns - The columns configuration for the table.
 * @returns {React.Component} The rendered data grid table component.
 */
const DataGridTable = ({ data, columns }) => {
  const flattenedData = data.flatMap((dataset) => dataset.data)

  return (
    <Box
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        paddingBottom: '54px',
        paddingTop: '18px',
      }}
    >
      <DataGrid
        rows={flattenedData.map((row, index) => ({ ...row, id: index }))}
        columns={columns}
        rowsPerPageOptions={[25, 50, 100]}
      />
    </Box>
  )
}

DataGridTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      data: PropTypes.arrayOf(PropTypes.object).isRequired,
    })
  ).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      headerName: PropTypes.string.isRequired,
      width: PropTypes.number,
    })
  ).isRequired,
}

export default DataGridTable
