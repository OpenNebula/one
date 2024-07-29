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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Paper, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { DEBUG_LEVEL } from 'client/constants'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    border: `1px solid ${theme.palette.divider}`,
    flexWrap: 'wrap',
    marginBottom: '0.8em',
  },
  grouped: {
    margin: theme.spacing(0.5),
    border: 'none',
    '&:not(:first-child)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-child': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}))

const Filters = memo(
  ({ log, filters, setFilters }) => {
    const classes = useStyles()

    const commands = Object.keys(log)

    const handleFilterCommands = (_, filterCommand) => {
      setFilters((prev) => ({ ...prev, command: filterCommand }))
    }

    const handleFilterSeverity = (_, filterCommand) => {
      setFilters((prev) => ({ ...prev, severity: filterCommand }))
    }

    return (
      <Paper elevation={0} className={classes.root}>
        {/* SEVERITY FILTER */}
        <ToggleButtonGroup
          classes={{
            grouped: classes.grouped,
          }}
          value={filters.severity}
          exclusive
          size="small"
          onChange={handleFilterSeverity}
        >
          {Object.values(DEBUG_LEVEL).map((severity) => (
            <ToggleButton key={severity} value={severity}>
              {severity}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Divider flexItem orientation="vertical" className={classes.divider} />

        {/* COMMANDS FILTER */}
        {commands.length > 1 && (
          <ToggleButtonGroup
            classes={{
              grouped: classes.grouped,
            }}
            value={filters.command}
            exclusive
            size="small"
            onChange={handleFilterCommands}
          >
            {commands?.map((command) => (
              <ToggleButton key={command} value={command}>
                {command}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </Paper>
    )
  },
  (prev, next) =>
    Object.keys(prev.log).length === Object.keys(next.log).length &&
    prev.filters.command === next.filters.command &&
    prev.filters.severity === next.filters.severity
)

Filters.propTypes = {
  filters: PropTypes.shape({
    command: PropTypes.string,
    severity: PropTypes.string,
  }),
  log: PropTypes.object.isRequired,
  setFilters: PropTypes.func,
}

Filters.defaultProps = {
  filters: {
    command: undefined,
    severity: undefined,
  },
  log: {},
  setFilters: () => undefined,
}

Filters.displayName = 'Filters'

export default Filters
