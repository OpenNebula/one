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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box, useTheme } from '@mui/material'

/**
 * @param {object} root0 - Props
 * @param {Array} root0.columns - Array of column contents
 * @param {Array} root0.layout - Layout array spacing, grid of 12
 * @returns {Component} - Rendering canvas
 */
const Canvas = ({ columns, layout }) => {
  const theme = useTheme()

  const flexValues = layout || Array(columns?.length).fill(12 / columns.length) // If no layout spec is provided we split the entire viewport width evenly

  const columnElements = columns.map((columnContent, index) => (
    <Box
      key={index}
      sx={{
        flex: flexValues[index],
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'stretch',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        bgcolor: theme?.palette?.background?.paper,
        marginX: '4px',
        padding: '16px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '4px',
      }}
    >
      {columnContent}
    </Box>
  ))

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        padding: '8px',
        gap: '8px',
      }}
    >
      {columnElements}
    </Box>
  )
}

Canvas.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.node).isRequired,
  layout: PropTypes.arrayOf(PropTypes.number),
}

export default Canvas
