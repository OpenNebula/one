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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Box, CircularProgress } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import {
  useTable,
  useGlobalFilter,
  useRowSelect,
  useFlexLayout,
} from 'react-table'

import { ListVirtualized } from 'client/components/List'
import Toolbar from 'client/components/Tables/Virtualized/toolbar'
import Header from 'client/components/Tables/Virtualized/header'
import Row from 'client/components/Tables/Virtualized/row'

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  table: {
    height: '100%',
    overflow: 'auto',
    border: `1px solid ${theme.palette.action.disabledBackground}`,
    borderRadius: 6,
  },
  body: {
    '& *[role=row]': {
      fontSize: '1em',
      fontWeight: theme.typography.fontWeightRegular,
      lineHeight: '1rem',

      overflowWrap: 'break-word',
      textAlign: 'start',
      padding: '1em',
      alignItems: 'center',

      color: theme.palette.text.primary,
      borderTop: `1px solid ${theme.palette.action.disabledBackground}`,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:first-of-type': {
        borderTopColor: 'transparent',
      },
    },
  },
  toolbar: {
    ...theme.typography.body1,
    color: theme.palette.text.hint,
    marginBottom: 16,

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1em',
  },
  total: {
    display: 'flex',
    alignItems: 'center',
    gap: '1em',
    transition: 200,
  },
}))

const DefaultCell = memo(({ value }) => value ?? '--')
DefaultCell.propTypes = { value: PropTypes.any }
DefaultCell.displayName = 'DefaultCell'

const VirtualizedTable = ({
  data,
  columns,
  isLoading,
  canFetchMore,
  fetchMore,
}) => {
  const classes = useStyles()

  const defaultColumn = useMemo(
    () => ({
      // Filter: DefaultFilter,
      Cell: DefaultCell,
    }),
    []
  )

  const useTableProps = useTable(
    { columns, data, defaultColumn },
    useRowSelect,
    useFlexLayout,
    useGlobalFilter
  )

  const { getTableProps, getTableBodyProps, rows } = useTableProps

  return (
    <Box {...getTableProps()} className={classes.root}>
      <div className={classes.toolbar}>
        <Toolbar useTableProps={useTableProps} />
        <div className={classes.total}>
          {isLoading && <CircularProgress size="1em" color="secondary" />}
          Total loaded: {useTableProps.rows.length}
        </div>
      </div>

      <div className={classes.table}>
        <Header useTableProps={useTableProps} />

        <div className={classes.body}>
          <ListVirtualized
            containerProps={{ ...getTableBodyProps() }}
            canFetchMore={canFetchMore}
            data={rows}
            isLoading={isLoading}
            fetchMore={fetchMore}
          >
            {(virtualItems) =>
              virtualItems?.map((virtualRow) => (
                <Row
                  key={virtualRow.index}
                  virtualRow={virtualRow}
                  useTableProps={useTableProps}
                />
              ))
            }
          </ListVirtualized>
        </div>
      </div>
    </Box>
  )
}

VirtualizedTable.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.array,
  isLoading: PropTypes.bool,
  canFetchMore: PropTypes.bool,
  fetchMore: PropTypes.func,
}

export default VirtualizedTable
