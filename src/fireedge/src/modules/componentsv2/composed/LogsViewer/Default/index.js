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

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
} from 'react'
import PropTypes from 'prop-types'
import { Box, useTheme } from '@mui/material'
import {
  List as VirtualizedList,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized'
import {
  Filter,
  SortDown,
  SortUp,
  RefreshDouble,
  RedoCircle,
} from 'iconoir-react'
import { useGeneralApi, ProvisionAPI } from '@FeaturesModule'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { getStyles } from '@modules/componentsv2/composed/LogsViewer/Default/styles'
import { SearchSlot } from '@modules/componentsv2/composed/SearchBar/Default/slots'
import { SearchBar } from '@modules/componentsv2/composed/SearchBar/Default'
import { Button, MenuButton } from '@modules/componentsv2/primitives/Buttons'
import clsx from 'clsx'

const createMeasurementCache = () =>
  new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 24,
    minHeight: 24,
    keyMapper: (rowIndex) => rowIndex,
  })

/**
 * Logs viewer component.
 *
 * @param {object} props - Log viewer properties
 * @param {object} props.logs - Logs data
 * @param {object} props.getLogs - Function to refresh logs
 * @param {boolean} props.isFetching - If the request to get logs to the API is in progress
 * @param {object} props.options - Component options
 * @param {number} props.provisionId - Provision ID
 * @param {Function} props.onRetry - Handle on retry
 * @param {string} props.messageSuccessGetLogs - Message when logs are refreshed successfully
 * @param {string} props.messageErrorGetLogs - Message when logs fail to refresh
 * @param {string} props.messageSuccessRetry - Message when retry succeeds
 * @param {string} props.messageErrorRetry - Message when retry fails
 * @returns {object} - The Log Viewer component
 */
const LogsViewer = ({
  logs,
  getLogs,
  isFetching,
  provisionId,
  onRetry,
  messageSuccessGetLogs = T.SuccessLogsFetched,
  messageErrorGetLogs = T.ErrorLogsFetch,
  messageSuccessRetry = T.SuccessProvisionRetried,
  messageErrorRetry = T.ErrorProvisionRetried,
  options = {},
}) => {
  const normalizedLogs = useMemo(
    () => ({
      ...logs,
      lines: Array.isArray(logs?.lines) ? logs.lines : [],
    }),
    [logs]
  )

  const hasLogs = normalizedLogs.lines.length > 0
  const { followLogs = false } = options

  const theme = useTheme()
  const classes = useMemo(() => getStyles(theme), [theme])

  const [sortAsc, setSortAsc] = useState(true)
  const [level, setLevel] = useState()
  const [filterValue, setFilterValue] = useState('')
  const [filteredLogs, setFilteredLogs] = useState(normalizedLogs.lines)

  const listRef = useRef(null)
  const cache = useMemo(createMeasurementCache, [])
  const levels = ['debug', 'info', 'warn', 'error']

  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [retry] = ProvisionAPI.useRetryProvisionMutation()

  const toggleSort = () => {
    setSortAsc((prev) => !prev)
  }

  const handleFilterLevel = (selectedLevel) => {
    setLevel((prev) => (prev === selectedLevel ? undefined : selectedLevel))
  }

  const applyFilters = useCallback(() => {
    let filtered = normalizedLogs.lines

    if (level) {
      filtered = filtered.filter(
        (log) => log?.level?.toLowerCase() === level.toLowerCase()
      )
    }

    const cleanText = filterValue.trim().toLowerCase()
    if (cleanText) {
      filtered = filtered.filter((log) =>
        log?.text?.toLowerCase().includes(cleanText)
      )
    }

    filtered = sortAsc ? filtered : [...filtered].reverse()

    setFilteredLogs(filtered)
  }, [normalizedLogs.lines, level, filterValue, sortAsc])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  useLayoutEffect(() => {
    cache.clearAll()
    listRef.current?.recomputeRowHeights()
  }, [cache, filteredLogs])

  useEffect(() => {
    if (followLogs && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow(filteredLogs.length - 1)
    }
  }, [filteredLogs, followLogs])

  const highlightMatch = (text = '', query = '') => {
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

  const retryLogs = async () => {
    try {
      const result = onRetry
        ? await onRetry()
        : await retry({ id: provisionId })

      if (result?.error) {
        throw new Error(result.error.message)
      }

      enqueueSuccess(messageSuccessRetry)
    } catch {
      enqueueError(messageErrorRetry)
    }
  }

  const refreshLogs = async () => {
    if (!getLogs) return

    try {
      const result = await getLogs()

      if (result?.error) {
        throw new Error(result.error.message)
      }

      enqueueSuccess(messageSuccessGetLogs)
    } catch {
      enqueueError(messageErrorGetLogs)
    }
  }

  const Row = ({ index, key, style, parent }) => {
    const log = filteredLogs[index] ?? {}
    const text = log.text ?? ''
    const regexDate = /^(.+?\[\w\])\s*(.*)/
    const matchDate = text.match(regexDate)
    const header = matchDate ? matchDate[1] : null
    const message = matchDate ? matchDate[2] : text

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
                  {highlightMatch(text, filterValue)}
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 0',
        minHeight: 0,
        minWidth: 0,
        gap: `${theme.scale[500]}px`,
      }}
    >
      <SearchBar
        slots={[
          [
            SearchSlot,
            {
              value: filterValue,
              placeholder: T.Search,
              onChange: setFilterValue,
              isDisabled: !hasLogs,
            },
            { flex: 10 },
          ],
          [
            () => (
              <MenuButton
                iconOnly={<Filter />}
                placeholder={level ? level.toUpperCase() : T['logs.level']}
                isDisabled={!hasLogs}
                type={STYLE_BUTTONS.TYPE.SECONDARY}
                options={[
                  levels.map((lvl) => ({
                    title: lvl,
                    onClick: () => handleFilterLevel(lvl),
                    sx: {
                      fontWeight: level === lvl ? 'bold' : 'normal',
                    },
                  })),
                ]}
              />
            ),
            {},
            { flex: '0 0 auto' },
          ],
          [
            () => (
              <Button
                data-cy={sortAsc ? 'sort-desc' : 'sort-asc'}
                iconOnly={sortAsc ? <SortDown /> : <SortUp />}
                title={T.Sort}
                type={STYLE_BUTTONS.TYPE.SECONDARY}
                isDisabled={!hasLogs}
                onClick={toggleSort}
              />
            ),
            {},
            { flex: '0 0 auto' },
          ],
          [
            () => (
              <Button
                data-cy="detail-refresh"
                iconOnly={<RefreshDouble />}
                title={T.Refresh}
                type={STYLE_BUTTONS.TYPE.SECONDARY}
                isDisabled={!getLogs || isFetching}
                onClick={refreshLogs}
              />
            ),
            {},
            { flex: '0 0 auto' },
          ],
          (onRetry || provisionId) && [
            () => (
              <Button
                data-cy="detail-retry"
                iconOnly={<RedoCircle />}
                title={T.Retry}
                type={STYLE_BUTTONS.TYPE.SECONDARY}
                isDisabled={isFetching}
                onClick={retryLogs}
              />
            ),
            {},
            { flex: '0 0 auto' },
          ],
        ].filter(Boolean)}
      />

      <Box className={classes.logsContainer} data-cy="logs-viewer">
        <AutoSizer>
          {({ height, width }) => (
            <VirtualizedList
              ref={listRef}
              width={width}
              height={height}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowCount={filteredLogs.length}
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
  getLogs: PropTypes.func,
  isFetching: PropTypes.bool,
  options: PropTypes.object,
  provisionId: PropTypes.string,
  onRetry: PropTypes.func,
  messageSuccessGetLogs: PropTypes.string,
  messageErrorGetLogs: PropTypes.string,
  messageSuccessRetry: PropTypes.string,
  messageErrorRetry: PropTypes.string,
}

export default LogsViewer
