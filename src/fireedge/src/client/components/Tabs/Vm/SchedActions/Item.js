/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import * as React from 'react'
import PropTypes from 'prop-types'

import { Edit, Trash, WarningTriangleOutline } from 'iconoir-react'
import { useTheme, Typography, Paper } from '@material-ui/core'

// import { useVmApi } from 'client/features/One'
import { Action } from 'client/components/Cards/SelectCard'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as VirtualMachine from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'
import { VM_ACTIONS } from 'client/constants'

const SchedulingItem = ({ vmStartTime, schedule, actions = [] }) => {
  const classes = rowStyles()
  const { palette } = useTheme()

  const { ID, ACTION, TIME, MESSAGE, DONE, WARNING } = schedule

  const isRelative = String(TIME).includes('+')

  const time = Helper.timeFromMilliseconds(
    isRelative ? (+vmStartTime + +TIME) : +TIME
  )

  const doneTime = Helper.timeFromMilliseconds(+DONE)

  const now = Math.round(Date.now() / 1000)
  const isWarning = WARNING && (now - +vmStartTime) > +WARNING

  const labels = [...new Set([
    Helper.stringToBoolean(MESSAGE)
  ])].filter(Boolean)

  const { repeat, end } = VirtualMachine.periodicityToString(schedule)

  return (
    <Paper variant='outlined' className={classes.root}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component='span'>
            {`#${ID} ${ACTION}`}
          </Typography>
          {!!labels.length && (
            <span className={classes.labels}>
              {labels.map(label => (
                <StatusChip key={label} text={label} />
              ))}
            </span>
          )}
        </div>
        <div className={classes.caption}>
          {repeat && <span>{repeat}</span>}
          {end && <span>{`| ${end}`}</span>}
          {DONE && (
            <span title={doneTime.toFormat('ff')}>
              {`| done ${doneTime.toRelative()}`}
            </span>
          )}
          <span style={{ display: 'flex', gap: '0.5em' }}>
            <span title={time.toFormat('ff')}>
              {`| ${time.toRelative()}`}
            </span>
            {isWarning && (
              <WarningTriangleOutline size={18} color={palette.warning.main} />
            )}
          </span>
        </div>
      </div>
      {!!actions.length && (
        <div className={classes.actions}>
          {actions?.includes?.(VM_ACTIONS.SCHED_ACTION_UPDATE) && (
            <Action
              cy={`${VM_ACTIONS.SCHED_ACTION_UPDATE}-${ID}`}
              icon={<Edit size={18} />}
              handleClick={() => undefined}
            />
          )}
          {actions?.includes?.(VM_ACTIONS.SCHED_ACTION_DELETE) && (
            <Action
              cy={`${VM_ACTIONS.SCHED_ACTION_DELETE}-${ID}`}
              icon={<Trash size={18} />}
              handleClick={() => undefined}
            />
          )}
        </div>
      )}
    </Paper>
  )
}

SchedulingItem.propTypes = {
  vmStartTime: PropTypes.string.isRequired,
  schedule: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string)
}

SchedulingItem.displayName = 'SchedulingItem'

export default SchedulingItem
