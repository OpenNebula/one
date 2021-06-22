/* eslint-disable react/prop-types */
import * as React from 'react'

import { makeStyles, Box, LinearProgress } from '@material-ui/core'
import {
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useTable
} from 'react-table'

import SplitPane from 'client/components/SplitPane'
import Toolbar from 'client/components/Tables/Virtualized/toolbar'
import Pagination from 'client/components/Tables/Enhanced/pagination'

import { addOpacityToColor } from 'client/utils'

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  body: {
    overflow: 'auto',
    display: 'grid',
    gap: '1em',
    gridTemplateColumns: '1fr',
    '& > [role=row]': {
      padding: '0.8em',
      cursor: 'pointer',
      color: palette.text.primary,
      backgroundColor: palette.background.paper,
      fontWeight: typography.fontWeightMedium,
      fontSize: '1em',
      borderRadius: 6,
      display: 'flex',
      gap: 8,
      '&:hover': {
        backgroundColor: palette.action.hover
      },
      '&.selected': {
        backgroundColor: addOpacityToColor(palette.secondary.main, 0.2),
        border: `1px solid ${palette.secondary.main}`
      }
    }
  },
  toolbar: {
    ...typography.body1,
    color: palette.text.hint,
    marginBottom: 16,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1em',
    '& > div:first-child': {
      flexGrow: 1
    }
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: '1em',
    transition: '200ms'
  }
}))

const DefaultCell = React.memo(({ value }) => value ?? '--')
DefaultCell.displayName = 'DefaultCell'

const EnhancedTable = ({
  data,
  columns,
  pageSize = 10,
  isLoading,
  showPageCount,
  getRowId,
  RowComponent,
  renderDetail,
  renderAllSelected = true,
  fetchMore,
  canFetchMore
}) => {
  const classes = useStyles()

  const defaultColumn = React.useMemo(() => ({
    // Filter: DefaultFilter,
    Cell: DefaultCell
  }), [])

  const useTableProps = useTable(
    {
      columns,
      data,
      defaultColumn,
      getRowId,
      autoResetPage: false,
      initialState: {
        pageSize
      }
    },
    useGlobalFilter,
    usePagination,
    useRowSelect
  )

  const {
    getTableProps,
    prepareRow,
    rows,
    page,
    gotoPage,
    pageCount,
    selectedFlatRows,
    state: { pageIndex }
  } = useTableProps

  const justOneSelected = selectedFlatRows.length === 1

  const handleChangePage = newPage => {
    gotoPage(newPage)

    const canNextPage = pageCount === -1 ? page.length >= pageSize : newPage < pageCount - 1

    newPage > pageIndex && canFetchMore && !canNextPage && fetchMore()
  }

  return (
    <SplitPane>
      <Box {...getTableProps()} className={classes.root}>
        <div className={classes.toolbar}>
          <Toolbar useTableProps={useTableProps} />
          <div className={classes.pagination}>
            {page?.length > 0 && (
              <Pagination
                handleChangePage={handleChangePage}
                useTableProps={useTableProps}
                count={rows.length}
                showPageCount={showPageCount}
              />
            )}
          </div>
        </div>

        {isLoading && <LinearProgress size='1em' color='secondary' />}

        <div className={classes.body}>
          {page.map(row => {
            prepareRow(row)

            /** @type {import('react-table').UseRowSelectRowProps} */
            const { getRowProps, original, toggleRowSelected, isSelected } = row
            const { key, ...rowProps } = getRowProps()

            return (
              <RowComponent
                {...rowProps}
                key={key}
                value={original}
                className={isSelected ? 'selected' : ''}
                onClick={() => toggleRowSelected(!isSelected)}
              />
            )
          })}
        </div>

      </Box>
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {justOneSelected && renderDetail
          ? renderDetail(selectedFlatRows[0]?.original)
          : renderAllSelected && (
            <pre>
              <code>
                {JSON.stringify(selectedFlatRows?.map(({ id }) => id)?.join(', '), null, 2)}
              </code>
            </pre>
          )
        }
      </div>
    </SplitPane>
  )
}

export default EnhancedTable
