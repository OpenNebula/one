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
import { useState, useMemo, Component } from 'react'
import PropTypes from 'prop-types'
import {
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  Pagination,
  Box,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  ButtonGroup,
  Button,
} from '@mui/material'
import { useGetServiceQuery } from 'client/features/OneApi/service'
import { timeFromMilliseconds } from 'client/models/Helper'
import { SERVICE_LOG_SEVERITY, T } from 'client/constants'
import { Tr } from 'client/components/HOC'

const PAGE_SIZE = 10

const severityDisplayNames = {
  I: 'Info',
  D: 'Debug',
  E: 'Error',
}

const sortOptions = {
  TIME: 'Time',
  SEVERITY: 'Severity',
  MESSAGE: 'Message',
}

/**
 * @param {object} root - Params
 * @param {number} root.id - Service Instance ID
 * @returns {Component} - Logging component
 */
const LogTab = ({ id }) => {
  const { data: service = {} } = useGetServiceQuery({ id })
  const { TEMPLATE: { BODY: { log = [] } = {} } = {} } = service

  const [filter, setFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [sortType, setSortType] = useState('TIME')
  const [sortAscending, setSortAscending] = useState(false)
  const [page, setPage] = useState(1)

  const sortedLogs = useMemo(() => {
    const sorted = [...log]
    sorted.sort((a, b) => {
      switch (sortType) {
        case 'SEVERITY':
          return sortAscending
            ? a.severity.localeCompare(b.severity)
            : b.severity.localeCompare(a.severity)
        case 'MESSAGE':
          return sortAscending
            ? a.message.localeCompare(b.message)
            : b.message.localeCompare(a.message)
        default:
          return sortAscending
            ? a.timestamp - b.timestamp
            : b.timestamp - a.timestamp
      }
    })

    return sorted
  }, [sortType, sortAscending])

  const filteredLogs = useMemo(
    () =>
      sortedLogs.filter(
        ({ severity, message }) =>
          (severityFilter === 'ALL' || severity === severityFilter) &&
          message.toLowerCase().includes(filter.toLowerCase())
      ),
    [sortedLogs, severityFilter, filter]
  )

  const paginatedLogs = useMemo(
    () => filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLogs, page]
  )

  const handleSortChange = (key) => {
    if (key === sortType) {
      setSortAscending(!sortAscending)
    } else {
      setSortType(key)
      setSortAscending(false)
    }
  }

  return (
    <Box
      sx={{
        p: '1em',
        height: '100%',
        width: '100%',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        mb={2}
        alignItems="center"
      >
        <TextField
          fullWidth
          label={Tr(T.Search)}
          variant="outlined"
          size="small"
          onChange={(e) => setFilter(e.target.value)}
        />

        <FormControl fullWidth size="small">
          <InputLabel id="severity-select-label">{Tr(T.Severity)}</InputLabel>
          <Select
            labelId="severity-select-label"
            label={Tr(T.Severity)}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <MenuItem value="ALL">{Tr(T.AllSeverities)}</MenuItem>
            {Object.entries(severityDisplayNames).map(([key, name]) => (
              <MenuItem key={key} value={key}>
                {Tr(T[name])}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ButtonGroup size="small" variant="outlined">
          {Object.entries(sortOptions).map(([key, name]) => (
            <Button
              key={key}
              onClick={() => handleSortChange(key)}
              variant={sortType === key ? 'contained' : 'outlined'}
            >
              {Tr(T[name])}
            </Button>
          ))}
        </ButtonGroup>
        <FormControlLabel
          control={
            <Switch
              checked={sortAscending}
              onChange={() => setSortAscending(!sortAscending)}
            />
          }
          label={sortAscending ? Tr(T.Asc) : Tr(T.Desc)}
        />
      </Stack>

      <Box
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          boxShadow: 2,
          borderRadius: '4px',
          width: '100%',
          height: '100%',
          maxHeight: '85%',
          overflow: 'hidden',
        }}
      >
        <Stack
          spacing={1}
          sx={{
            overflowY: 'auto',
            maxHeight: 'calc(100% - 70px)',
          }}
        >
          {paginatedLogs.map(({ severity, message, timestamp }, index) => {
            const time = timeFromMilliseconds(+timestamp)

            return (
              <Typography
                key={`message-${timestamp}-${index}`}
                variant="body2"
                sx={{
                  color:
                    severity === SERVICE_LOG_SEVERITY.ERROR
                      ? 'error.dark'
                      : severity === SERVICE_LOG_SEVERITY.INFO
                      ? 'info.dark'
                      : 'text.primary',
                  fontWeight:
                    severity === SERVICE_LOG_SEVERITY.ERROR ? 'bold' : 'normal',
                  backgroundColor:
                    severity === SERVICE_LOG_SEVERITY.ERROR
                      ? 'error.light'
                      : severity === SERVICE_LOG_SEVERITY.INFO
                      ? 'info.light'
                      : 'success.light',
                  p: 1,
                  borderRadius: '4px',
                }}
              >
                {`${time.toFormat('ff')} [${
                  severityDisplayNames[severity]
                }] ${message}`}
              </Typography>
            )
          })}
        </Stack>
      </Box>

      <Pagination
        sx={{ mt: 2, mb: 2 }}
        count={Math.ceil(filteredLogs.length / PAGE_SIZE)}
        page={page}
        onChange={(_e, value) => setPage(value)}
        variant="outlined"
        shape="rounded"
        size="medium"
      />
    </Box>
  )
}

LogTab.propTypes = { tabProps: PropTypes.object, id: PropTypes.string }
LogTab.displayName = 'Roles'

export default LogTab
