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
import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  FormControl,
  InputBase,
  useTheme,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Tooltip,
  TextField,
} from '@mui/material'

import { Search as SearchIcon } from 'iconoir-react'
import { T } from '@ConstantsModule'
import { Tr, Translate, Timer } from '@modules/components'
import { styles } from '@modules/components/EventsViewer/styles'
import { useAuth } from '@FeaturesModule'
import DatePicker from '@mui/lab/DatePicker'

import { timeFromMilliseconds } from '@ModelsModule'
import { Settings } from 'luxon'

import LocalizationProvider from '@mui/lab/LocalizationProvider'
import AdapterLuxon from '@mui/lab/AdapterLuxon'

// Get the comparator
const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }

  return 0
}

// Get the order to compare
const getComparator = (order, orderBy) =>
  order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)

// Definition of the columns
const headCells = [
  {
    id: 'action',
    numeric: false,
    label: 'Action',
    order: false,
  },
  {
    id: 'description',
    numeric: false,
    label: 'Description',
    order: false,
  },
  {
    id: 'time',
    numeric: false,
    label: 'Time',
    order: true,
  },
]

/**
 * Create the header of the table.
 *
 * @param {object} props - Props with the order and sorter
 * @returns {object} - The header component
 */
const EnhancedTableHead = (props) => {
  // Get order and sort
  const { order, orderBy, onRequestSort } = props

  // Create sort handler
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property)
  }

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.order ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {Tr(T[headCell.label])}
              </TableSortLabel>
            ) : (
              Tr(T[headCell.label])
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
}

/**
 * Lov viewer component.
 *
 * @param {object} props - Log viewer properties
 * @param {object} props.events - Events data
 * @returns {object} - The Events Viewer component
 */
const EventsViewer = ({ events = [] }) => {
  // Get styles
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  // States for filter by value and filter by dates
  const [filterValue, setFilterValue] = useState('')
  const [filterInitTimeValue, setFilterInitTimeValue] = useState()
  const [filterEndTimeValue, setFilterEndTimeValue] = useState()

  // States for order
  const [order, setOrder] = useState('desc')
  const [orderBy, setOrderBy] = useState('time')

  // States for pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Highlight search matches
  const highlightMatch = (text, query) => {
    if (!query) return text
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: '#ffee58', padding: '0 2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Visible rows of a page
  const visibleRows = useMemo(() => {
    // Get filter value
    const search = filterValue?.toLowerCase() || ''

    // Get filter dates
    const startTimeSeconds = filterInitTimeValue
      ? Math.floor(filterInitTimeValue.toMillis() / 1000)
      : null
    const endTimeSeconds = filterEndTimeValue
      ? Math.floor(filterEndTimeValue.toMillis() / 1000)
      : null

    // Filter and order events
    return [...events]
      .filter((event) => {
        const matchesText =
          event.action.toLowerCase().includes(search) ||
          event.description.toLowerCase().includes(search)

        const matchesTime =
          (!startTimeSeconds || event.time >= startTimeSeconds) &&
          (!endTimeSeconds || event.time <= endTimeSeconds)

        return matchesText && matchesTime
      })
      .sort(getComparator(order, orderBy))
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [
    page,
    rowsPerPage,
    events,
    order,
    orderBy,
    filterValue,
    filterInitTimeValue,
    filterEndTimeValue,
  ])

  // Get locale lang
  const { settings: fireedge = {} } = useAuth()
  const lang = fireedge?.LANG?.substring(0, 2)
  Settings.defaultLocale = lang

  return (
    <Stack className={classes.container}>
      {/* Search input */}
      <Stack className={classes.toolbar}>
        <div className={classes.search}>
          <div className={classes.searchIcon}>
            <SearchIcon />
          </div>
          <FormControl className={classes.inputRoot}>
            <InputBase
              value={filterValue}
              type="search"
              onChange={(event) => setFilterValue(event.target.value)}
              placeholder={`${Tr(T.Search)}...`}
              classes={{ root: classes.inputRoot, input: classes.inputInput }}
              inputProps={{ 'aria-label': 'search', 'data-cy': 'log-search' }}
            />
          </FormControl>
        </div>

        <Stack direction="row" gap="5px">
          <LocalizationProvider dateAdapter={AdapterLuxon} locale={lang}>
            <DatePicker
              value={filterInitTimeValue ?? null}
              onChange={(newValue) => setFilterInitTimeValue(newValue)}
              label={<Translate word={T.StartDate} />}
              renderInput={({ inputProps, ...dateTimePickerProps }) => (
                <TextField
                  {...dateTimePickerProps}
                  fullWidth
                  inputProps={{ ...inputProps, 'data-cy': 'date-init' }}
                />
              )}
              views={['year', 'month', 'day']}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterLuxon} locale={lang}>
            <DatePicker
              value={filterEndTimeValue ?? null}
              onChange={(newValue) => setFilterEndTimeValue(newValue)}
              label={<Translate word={T.EndDate} />}
              renderInput={({ inputProps, ...dateTimePickerProps }) => (
                <TextField
                  {...dateTimePickerProps}
                  fullWidth
                  inputProps={{ ...inputProps, 'data-cy': 'date-end' }}
                />
              )}
              views={['year', 'month', 'day']}
            />
          </LocalizationProvider>
        </Stack>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table
          sx={{ minWidth: 650, tableLayout: 'fixed' }}
          aria-label="events-table"
        >
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={(_, property) => {
              const isAsc = orderBy === property && order === 'asc'
              setOrder(isAsc ? 'desc' : 'asc')
              setOrderBy(property)
            }}
          />
          <TableBody>
            {visibleRows?.map((event, index) => (
              <TableRow
                key={`event-${event.action}-${index}`}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell className={classes.action}>
                  <Tooltip title={event.action} arrow>
                    <span className={classes.logText}>
                      {highlightMatch(event.action, filterValue)}
                    </span>
                  </Tooltip>
                </TableCell>

                <TableCell className={classes.description}>
                  <Tooltip title={event.description} arrow>
                    <span className={classes.logText}>
                      {highlightMatch(event.description, filterValue)}
                    </span>
                  </Tooltip>
                </TableCell>

                <TableCell className={classes.time}>
                  <Stack direction="column">
                    <Timer initial={timeFromMilliseconds(event.time)} />
                    <Tooltip
                      title={timeFromMilliseconds(event.time).toFormat('ff')}
                      arrow
                    >
                      <span className={classes.logDate}>
                        {timeFromMilliseconds(event.time).toFormat('ff')}
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={events.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10))
          setPage(0)
        }}
        sx={{ alignSelf: 'flex-end' }}
      />
    </Stack>
  )
}

EventsViewer.propTypes = {
  events: PropTypes.array,
}

export default EventsViewer
