/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { Box } from '@mui/material'
import { SortDown, SortUp } from 'iconoir-react'
import { Settings } from 'luxon'
import PropTypes from 'prop-types'
import { memo, useEffect, useMemo, useState } from 'react'

import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import { getStyles } from '@modules/componentsv2/composed/EventsViewer/Default/styles'
import { SearchBar } from '@modules/componentsv2/composed/SearchBar/Default'
import { SearchSlot } from '@modules/componentsv2/composed/SearchBar/Default/slots'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { Datepicker } from '@modules/componentsv2/primitives/Datepicker'
import { Table } from '@modules/componentsv2/primitives/Tables'
import { timeFromMilliseconds } from '@UtilsModule'

const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }

  if (b[orderBy] > a[orderBy]) {
    return 1
  }

  return 0
}

const getComparator = (order, orderBy) =>
  order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)

const safeText = (value) => String(value ?? '')

/**
 * @param {Date} date - Date filter value
 * @returns {number|null} - Start of day in seconds
 */
const getStartOfDaySeconds = (date) => {
  if (!date) return null

  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)

  return Math.floor(startDate.getTime() / 1000)
}

/**
 * @param {Date} date - Date filter value
 * @returns {number|null} - End of day in seconds
 */
const getEndOfDaySeconds = (date) => {
  if (!date) return null

  const endDate = new Date(date)
  endDate.setHours(23, 59, 59, 999)

  return Math.floor(endDate.getTime() / 1000)
}

/**
 * @param {object} props - Date filter slot props
 * @param {Date} props.value - Selected date
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Datepicker placeholder
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @returns {object} - Datepicker slot
 */
const DateFilterSlot = ({ value, onChange, placeholder, minDate, maxDate }) => (
  <Box
    className="events-date-filter"
    sx={{
      width: '100%',
      '& > div': {
        width: '100%',
      },
    }}
  >
    <Datepicker
      value={value ?? null}
      onChange={onChange}
      placeholder={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      popperPlacement="bottom-start"
    />
  </Box>
)

DateFilterSlot.propTypes = {
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.initial - Initial time
 * @returns {object} - Relative event time
 */
const RelativeTime = memo(({ initial }) => {
  const initialValue = useMemo(() => timeFromMilliseconds(initial), [initial])
  const [time, setTime] = useState(() => initialValue.toRelative())

  useEffect(() => {
    const tick = setInterval(() => {
      const nextTime = initialValue.toRelative()

      setTime((currentTime) =>
        nextTime !== currentTime ? nextTime : currentTime
      )
    }, 1000)

    return () => {
      clearInterval(tick)
    }
  }, [initialValue])

  return <>{time}</>
})

RelativeTime.propTypes = {
  initial: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

RelativeTime.displayName = 'RelativeTime'

/**
 * @param {number|string} time - Event time in seconds
 * @returns {string} - Formatted event time
 */
const formatEventTime = (time) => timeFromMilliseconds(time).toFormat('ff')

/**
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string|object[]} - Highlighted text
 */
const highlightMatch = (text, query) => {
  const parsedText = safeText(text)
  if (!query) return parsedText

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = parsedText.split(regex)
  const parsedQuery = query.toLowerCase()

  return parts.map((part, index) =>
    part.toLowerCase() === parsedQuery ? (
      <mark key={index} className="events-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

/**
 * Events viewer component.
 *
 * @param {object} props - Events viewer properties
 * @param {object[]} props.events - Events data
 * @param {boolean} props.isLoading - Events loading state
 * @returns {object} - The Events Viewer component
 */
export const EventsViewer = ({ events = [], isLoading = false }) => {
  const [filterValue, setFilterValue] = useState('')
  const [filterInitTimeValue, setFilterInitTimeValue] = useState(null)
  const [filterEndTimeValue, setFilterEndTimeValue] = useState(null)
  const [order, setOrder] = useState('desc')

  const { settings: fireedge = {} } = useAuth()
  const lang = fireedge?.LANG?.substring(0, 2)
  Settings.defaultLocale = lang

  const eventList = useMemo(
    () => [].concat(events ?? []).filter(Boolean),
    [events]
  )

  const tableData = useMemo(() => {
    const search = filterValue?.toLowerCase() || ''
    const startTimeSeconds = getStartOfDaySeconds(filterInitTimeValue)
    const endTimeSeconds = getEndOfDaySeconds(filterEndTimeValue)

    return [...eventList]
      .filter((event) => {
        const matchesText =
          safeText(event?.action).toLowerCase().includes(search) ||
          safeText(event?.description).toLowerCase().includes(search)

        const matchesTime =
          (!startTimeSeconds || event?.time >= startTimeSeconds) &&
          (!endTimeSeconds || event?.time <= endTimeSeconds)

        return matchesText && matchesTime
      })
      .sort(getComparator(order, 'time'))
  }, [eventList, order, filterValue, filterInitTimeValue, filterEndTimeValue])

  const columns = useMemo(
    () => [
      {
        header: T.Action,
        id: 'action',
        accessorFn: ({ action }) => safeText(action),
        width: '20%',
        cell: ({ row }) => (
          <span className="events-log-text">
            {highlightMatch(row?.original?.action, filterValue)}
          </span>
        ),
      },
      {
        header: T.Description,
        id: 'description',
        accessorFn: ({ description }) => safeText(description),
        width: '60%',
        cell: ({ row }) => (
          <span className="events-log-text">
            {highlightMatch(row?.original?.description, filterValue)}
          </span>
        ),
      },
      {
        header: T.Time,
        id: 'time',
        accessorFn: ({ time }) => formatEventTime(time),
        width: '20%',
        cell: ({ row }) => (
          <Box className="events-time-cell">
            <RelativeTime initial={row?.original?.time} />
            <span className="events-time-separator">-</span>
            <span className="events-log-date">
              {formatEventTime(row?.original?.time)}
            </span>
          </Box>
        ),
      },
    ],
    [filterValue]
  )

  const toggleSort = () =>
    setOrder((currentOrder) => (currentOrder === 'asc' ? 'desc' : 'asc'))

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="events-searchbar">
        <SearchBar
          slots={[
            [
              SearchSlot,
              {
                value: filterValue,
                placeholder: T.Search,
                onChange: setFilterValue,
              },
              { flex: 10 },
            ],
            [
              DateFilterSlot,
              {
                value: filterInitTimeValue,
                onChange: setFilterInitTimeValue,
                placeholder: T.StartDate,
                maxDate: filterEndTimeValue ?? new Date(),
              },
              { flex: '0 1 242px' },
            ],
            [
              DateFilterSlot,
              {
                value: filterEndTimeValue,
                onChange: setFilterEndTimeValue,
                placeholder: T.EndDate,
                minDate: filterInitTimeValue ?? new Date('1900-01-01'),
                maxDate: new Date(),
              },
              { flex: '0 1 242px' },
            ],
            [
              () => (
                <Button
                  data-cy={order === 'asc' ? 'sort-desc' : 'sort-asc'}
                  iconOnly={order === 'asc' ? <SortDown /> : <SortUp />}
                  size="medium"
                  title={T.Sort}
                  type={STYLE_BUTTONS.TYPE.SECONDARY}
                  onClick={toggleSort}
                />
              ),
              {},
              { flex: '0 0 auto' },
            ],
          ]}
        />
      </Box>

      <Box className="events-table-container">
        <Table
          columns={columns}
          data={tableData}
          isRowsSelectable={false}
          isLoading={isLoading}
          size="medium"
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
    </Box>
  )
}

EventsViewer.propTypes = {
  events: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  isLoading: PropTypes.bool,
}

EventsViewer.displayName = 'EventsViewer'

export default EventsViewer
