import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Box, LinearProgress } from '@material-ui/core'
import {
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable
} from 'react-table'

import SplitPane from 'client/components/SplitPane'
import Toolbar from 'client/components/Tables/Enhanced/toolbar'
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
    marginBottom: 16,
    display: 'flex',
    gap: '1em',
    alignItems: 'start',
    justifyContent: 'space-between',
    '& > div:first-child': {
      flexGrow: 1
    },
    [breakpoints.down('sm')]: {
      flexWrap: 'wrap'
    }
  },
  pagination: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '1em'
  },
  loading: {
    transition: '200ms'
  }
}))

const EnhancedTable = ({
  canFetchMore,
  columns,
  data,
  fetchMore,
  getRowId,
  isLoading,
  pageSize = 10,
  renderAllSelected = true,
  renderDetail,
  RowComponent,
  showPageCount
}) => {
  const classes = useStyles()

  const defaultColumn = React.useMemo(() => ({
    // Filter: DefaultFilter,
  }), [])

  const sortTypes = React.useMemo(() => ({
    length: (rowA, rowB, columnId, desc) => desc
      ? rowB.values[columnId].length - rowA.values[columnId].length
      : rowA.values[columnId].length - rowB.values[columnId].length
  }), [])

  const useTableProps = useTable(
    {
      columns,
      data,
      defaultColumn,
      sortTypes,
      getRowId,
      // When table has update, disable all of the auto resetting
      autoResetExpanded: false,
      autoResetFilters: false,
      autoResetGroupBy: false,
      autoResetPage: false,
      autoResetRowState: false,
      autoResetSelectedRow: false,
      autoResetSelectedRows: false,
      autoResetSortBy: false,
      // -------------------------------------
      initialState: {
        pageSize
      }
    },
    useGlobalFilter,
    useSortBy,
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
    state: { pageIndex, selectedRowIds }
  } = useTableProps

  const selectedRows = React.useMemo(
    () => rows.filter(row => !!selectedRowIds[row.id]),
    [rows, selectedRowIds]
  )

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

        {isLoading && (
          <LinearProgress size='1em' color='secondary' className={classes.loading} />
        )}

        <div className={classes.body}>
          {page.map(row => {
            prepareRow(row)

            /** @type {import('react-table').UseRowSelectRowProps} */
            const { getRowProps, values, toggleRowSelected, isSelected } = row
            const { key, ...rowProps } = getRowProps()

            return (
              <RowComponent
                {...rowProps}
                key={key}
                value={values}
                className={isSelected ? 'selected' : ''}
                onClick={() => toggleRowSelected(!isSelected)}
              />
            )
          })}
        </div>
      </Box>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {selectedRows?.length === 1 && renderDetail
          ? renderDetail(selectedRows[0]?.values)
          : renderAllSelected && (
            <pre>
              <code>
                {JSON.stringify(Object.keys(selectedRowIds)?.join(', '), null, 2)}
              </code>
            </pre>
          )
        }
      </div>
    </SplitPane>
  )
}

EnhancedTable.propTypes = {
  canFetchMore: PropTypes.bool,
  columns: PropTypes.array,
  data: PropTypes.array,
  fetchMore: PropTypes.func,
  getRowId: PropTypes.func,
  isLoading: PropTypes.bool,
  pageSize: PropTypes.number,
  renderAllSelected: PropTypes.bool,
  renderDetail: PropTypes.func,
  RowComponent: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  showPageCount: PropTypes.bool
}

export default EnhancedTable
