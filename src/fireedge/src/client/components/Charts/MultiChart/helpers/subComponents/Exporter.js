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
import React, { useState } from 'react'
import { Button, Menu, MenuItem, Box } from '@mui/material'
import { Download } from 'iconoir-react'
import {
  exportDataToCSV,
  exportDataToPDF,
} from 'client/components/Charts/MultiChart/helpers/scripts'
import { useGeneralApi } from 'client/features/General'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Renders a button that provides export options for data.
 *
 * @param {object} props - The properties for the component.
 * @param {Array} props.data - The data to be exported.
 * @param {Array} props.exportOptions - The available export options.
 * @param {object} props.exportHandlers - The handlers for each export type.
 * @returns {React.Component} The rendered export button component.
 */
export const ExportButton = ({ data, exportOptions, exportHandlers }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const { enqueueError } = useGeneralApi()

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExport = (type) => {
    if (exportHandlers[type]) {
      const error = exportHandlers[type](data)
      if (error) {
        enqueueError(T.ErrorExportingData, [type.toUpperCase(), error.message])
      }
    }
    handleMenuClose()
  }

  const noData = data.every((item) => item.isEmpty)

  return (
    <Box>
      <Button
        endIcon={<Download />}
        onClick={handleMenuOpen}
        disabled={noData}
        variant="outlined"
        sx={{
          padding: '3px 17px',
          transition: 'all 0.1s ease',
          '&:hover': {
            borderColor: '#2a2a2a',
          },
        }}
      >
        {Tr(T.Export)}
      </Button>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {exportOptions.map((option) => (
          <MenuItem key={option.type} onClick={() => handleExport(option.type)}>
            {Tr(option.label)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

ExportButton.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  exportOptions: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  exportHandlers: PropTypes.objectOf(PropTypes.func),
}

ExportButton.defaultProps = {
  exportOptions: [
    { type: 'csv', label: T.ExportCSV },
    { type: 'pdf', label: T.ExportPDF },
  ],
  exportHandlers: {
    csv: (data) => exportDataToCSV(data),
    pdf: (data) => exportDataToPDF(data),
  },
}
