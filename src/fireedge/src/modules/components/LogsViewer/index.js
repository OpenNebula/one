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
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  FormControl,
  InputBase,
  useTheme,
  MenuList,
  MenuItem,
  Stack,
} from '@mui/material'
import {
  List as VirtualizedList,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized'
import {
  Search as SearchIcon,
  Filter,
  SortDown,
  SortUp,
  RefreshDouble,
  RedoCircle,
} from 'iconoir-react'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { ProvisionAPI } from '@FeaturesModule'
import { Tr, Translate, SubmitButton } from '@modules/components'
import { styles } from '@modules/components/LogsViewer/styles'
import HeaderPopover from '@modules/components/Header/Popover'
import clsx from 'clsx'

/**
 * Cache for Cell Measure (to calculate height of log lines)
 */
const cache = new CellMeasurerCache({
  fixedWidth: true,
  defaultHeight: 24,
  minHeight: 24,
  keyMapper: (rowIndex) => rowIndex,
})

/**
 * Lov viewer component.
 *
 * @param {object} props - Log viewer properties
 * @param {object} props.logs - Logs data
 * @param {object} props.getLogs - Function to refresh logs
 * @param {boolean} props.isFetching - If the request to get logs to the API is in progress
 * @param {object} props.options - Component options
 * @param {number} props.provisionId - Provision ID
 * @returns {object} - The Log Viewer component
 */
const LogsViewer = ({
  logs,
  getLogs,
  isFetching,
  provisionId,
  options = {},
}) => {
  // Get options
  const { followLogs = false } = options

  // Get styles
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  // Sort
  const [sortAsc, setSortAsc] = useState(true)
  const toggleSort = () => {
    setSortAsc((prev) => !prev)
  }

  // Levels of debug and filters
  const levels = ['debug', 'info', 'warn', 'error']
  const [level, setLevel] = useState()
  const [filterValue, setFilterValue] = useState('')
  const [filteredLogs, setFilteredLogs] = useState(logs?.lines || [])

  const [retry] = ProvisionAPI.useRetryProvisionMutation()

  // Follow logs
  useEffect(() => {
    if (followLogs && listRef.current && filteredLogs.length > 0) {
      // Scroll to the last row
      listRef.current.scrollToRow(filteredLogs.length - 1)
    }
  }, [filteredLogs, followLogs])

  // Virtualized list ref
  const listRef = useRef(null)

  // Recompute row heights if logs change
  useEffect(() => {
    if (listRef.current) {
      cache.clearAll()
      listRef.current.recomputeRowHeights()
    }
  }, [logs])

  // Combined filtering function
  const applyFilters = useCallback(() => {
    let filtered = logs.lines

    // Filter by level
    if (level) {
      filtered = filtered.filter(
        (log) => log.level.toLowerCase() === level.toLowerCase()
      )
    }

    // Filter by text
    const cleanText = filterValue.trim().toLowerCase()
    if (cleanText) {
      filtered = filtered.filter((log) =>
        log.text.toLowerCase().includes(cleanText)
      )
    }

    // Sort
    filtered = sortAsc ? filtered : [...filtered].reverse()

    setFilteredLogs(filtered)
  }, [logs.lines, level, filterValue, sortAsc])

  // Handlers
  const handleFilterText = (event) => {
    setFilterValue(event.target.value)
  }

  const handleFilterLevel = (selectedLevel) => {
    // Toggle: if the clicked level is already active, clear it
    setLevel((prev) => (prev === selectedLevel ? undefined : selectedLevel))
  }

  // Trigger filtering whenever search text or level changes
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

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
  const Row = ({ index, key, style, parent }) => {
    const log = filteredLogs[index]
    const regexDate = /^(.+?\[\w\])\s*(.*)/
    const matchDate = log.text.match(regexDate)
    const header = matchDate ? matchDate[1] : null
    const message = matchDate ? matchDate[2] : log.text

    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({ registerChild, measure }) => (
          <div
            ref={registerChild}
            onLoad={measure}
            style={{
              ...style,
              padding: '4px 8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <Box
              className={clsx(
                classes.containerText,
                log.level && classes[`${log.level}Log`]
              )}
            >
              {header ? (
                <>
                  <span className={classes.dateText}>
                    {highlightMatch(header, filterValue)}
                  </span>
                  <span className={classes.logText}>
                    {highlightMatch(message, filterValue)}
                  </span>
                </>
              ) : (
                <span className={classes.logText}>
                  {highlightMatch(log.text, filterValue)}
                </span>
              )}
            </Box>
          </div>
        )}
      </CellMeasurer>
    )
  }

  Row.propTypes = {
    index: PropTypes.number.isRequired,
    key: PropTypes.string,
    style: PropTypes.object.isRequired,
    parent: PropTypes.object.isRequired,
  }

  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          gap: 2,
          mb: 2,
          mt: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Search input */}
        <div className={classes.search}>
          <div className={classes.searchIcon}>
            <SearchIcon />
          </div>
          <FormControl className={classes.inputRoot}>
            <InputBase
              value={filterValue}
              type="search"
              onChange={handleFilterText}
              placeholder={`${Tr(T.Search)}...`}
              classes={{ root: classes.inputRoot, input: classes.inputInput }}
              inputProps={{ 'aria-label': 'search', 'data-cy': 'log-search' }}
            />
          </FormControl>
        </div>

        <Stack
          direction="row"
          sx={{
            gap: 2,
            mb: 2,
            mt: 2,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {/* Level filter popover */}
          <HeaderPopover
            id="filter-by-level"
            icon={<Filter />}
            buttonLabel={
              level ? level.toUpperCase() : <Translate word={T['logs.level']} />
            }
            buttonProps={{
              'data-cy': 'filter-by-level',
              disableElevation: true,
              importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
              size: STYLE_BUTTONS.SIZE.MEDIUM,
              type: STYLE_BUTTONS.TYPE.FILLED,
              active: level !== undefined,
            }}
            popperProps={{ placement: 'bottom-end' }}
          >
            {() => (
              <MenuList>
                {levels.map((lvl) => (
                  <MenuItem key={lvl} onClick={() => handleFilterLevel(lvl)}>
                    <span
                      style={{ fontWeight: level === lvl ? 'bold' : 'normal' }}
                    >
                      {lvl}
                    </span>
                  </MenuItem>
                ))}
              </MenuList>
            )}
          </HeaderPopover>

          {sortAsc ? (
            <SubmitButton
              data-cy="sort-desc"
              icon={<SortDown />}
              tooltip={Tr(T.Sort)}
              onClick={toggleSort}
            />
          ) : (
            <SubmitButton
              data-cy="sort-asc"
              icon={<SortUp />}
              tooltip={Tr(T.Sort)}
              onClick={toggleSort}
            />
          )}
          <SubmitButton
            data-cy="detail-refresh"
            icon={<RefreshDouble />}
            tooltip={Tr(T.Refresh)}
            isSubmitting={isFetching}
            onClick={() => getLogs()}
          />
          <SubmitButton
            data-cy="detail-retry"
            icon={<RedoCircle />}
            tooltip={Tr(T.Retry)}
            isSubmitting={isFetching}
            onClick={() => retry({ id: provisionId })}
          />
        </Stack>
      </Stack>

      {/* Virtualized log list */}
      <Box
        style={{ height: 600 }}
        className={classes.logsContainer}
        data-cy="logs-viewer"
      >
        <AutoSizer>
          {({ height, width }) => (
            <VirtualizedList
              ref={listRef}
              width={width}
              height={height}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowCount={filteredLogs?.length || 0}
              rowRenderer={Row}
              overscanRowCount={10}
            />
          )}
        </AutoSizer>
      </Box>
    </Box>
  )
}

LogsViewer.propTypes = {
  logs: PropTypes.object,
  getLogs: PropTypes.object,
  isFetching: PropTypes.bool,
  options: PropTypes.object,
  provisionId: PropTypes.string,
}

export default LogsViewer
