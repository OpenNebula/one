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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { Box } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { UseTableInstanceProps, UseTableRowProps } from 'react-table'
import { VirtualItem } from 'react-virtual'

const useStyles = makeStyles(() => ({
  root: {
    // <-- it's needed to virtualize -->
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  virtual: ({ size, start }) => ({
    height: size,
    transform: `translateY(${start}px)`,
  }),
}))

const Row = ({ virtualRow, useTableProps }) => {
  /** @type {VirtualItem} */
  const { index, measureRef, size, start } = virtualRow

  const classes = useStyles({ size, start })

  /** @type {UseTableInstanceProps} */
  const { rows, prepareRow } = useTableProps

  /** @type {UseTableRowProps} */
  const row = rows[index]

  prepareRow(row)

  const renderCell = useCallback(
    (cell) => <Box {...cell.getCellProps()}>{cell.render('Cell')}</Box>,
    []
  )

  return (
    <Box
      {...row.getRowProps()}
      ref={measureRef}
      className={clsx(classes.root, classes.virtual)}
    >
      {row?.cells?.map(renderCell)}
    </Box>
  )
}

Row.propTypes = {
  virtualRow: PropTypes.object,
  useTableProps: PropTypes.object,
}

Row.defaultProps = {
  virtualRow: {},
  useTableProps: {},
}

export default Row
