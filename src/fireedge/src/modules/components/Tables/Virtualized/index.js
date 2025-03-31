/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { css } from '@emotion/css'
import { Box, CircularProgress, useTheme } from '@mui/material'
import { memo, useMemo } from 'react'

import {
  useFlexLayout,
  useGlobalFilter,
  useRowSelect,
  useTable,
} from 'opennebula-react-table'
import PropTypes from 'prop-types'

import { ListVirtualized } from '@modules/components/List'
import Header from '@modules/components/Tables/Virtualized/header'
import Row from '@modules/components/Tables/Virtualized/row'
import Toolbar from '@modules/components/Tables/Virtualized/toolbar'

const useStyles = (theme) => ({
  root: css({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }),
  table: css({
    height: '100%',
    overflow: 'auto',
    border: `1px solid ${theme.palette.action.disabledBackground}`,
    borderRadius: 6,
  }),
  body: css({
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
  }),
  toolbar: css({
    ...theme.typography.body1,
    color: theme.palette.text.hint,
    marginBottom: 16,

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1em',
  }),
  total: css({
    display: 'flex',
    alignItems: 'center',
    gap: '1em',
    transition: 200,
  }),
})

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
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

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
          {isLoading && <CircularProgress size="1em" />}
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
