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
import { useContext } from 'react'
import PropTypes from 'prop-types'
import { WarningTriangleOutline as WarningIcon } from 'iconoir-react'
import { useTheme, Typography, Paper } from '@mui/material'

import { TabContext } from 'client/components/Tabs/TabProvider'
import * as Actions from 'client/components/Tabs/Vm/SchedActions/Actions'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import { Tr } from 'client/components/HOC'

import * as VirtualMachine from 'client/models/VirtualMachine'
import { timeFromMilliseconds } from 'client/models/Helper'
import { sentenceCase } from 'client/utils'
import { T, VM_ACTIONS } from 'client/constants'

const SchedulingItem = ({ schedule, actions = [] }) => {
  const classes = rowStyles()
  const { palette } = useTheme()

  const { data: vm } = useContext(TabContext)
  const vmStartTime = +vm?.STIME
  const { ID, ACTION, TIME, MESSAGE, DONE, WARNING } = schedule

  const titleAction = `#${ID} ${sentenceCase(ACTION)}`
  const isRelative = String(TIME).includes('+')

  const time = timeFromMilliseconds(isRelative ? vmStartTime + +TIME : +TIME)

  const doneTime = timeFromMilliseconds(+DONE)

  const now = Math.round(Date.now() / 1000)
  const isWarning = WARNING && now - vmStartTime > +WARNING

  const labels = [...new Set([MESSAGE])].filter(Boolean)

  const { repeat, end } = VirtualMachine.periodicityToString(schedule)

  return (
    <Paper variant="outlined" className={classes.root}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component="span">{titleAction}</Typography>
          {!!labels.length && (
            <span className={classes.labels}>
              {labels.map((label) => (
                <StatusChip key={label} text={label} />
              ))}
            </span>
          )}
        </div>
        <div className={classes.caption}>
          {repeat && <span>{`${repeat} |`}</span>}
          {end && <span>{`${end} |`}</span>}
          {DONE && (
            <span title={doneTime.toFormat('ff')}>
              {`${Tr(T.Done)} ${doneTime.toRelative()} |`}
            </span>
          )}
          <span style={{ display: 'flex', gap: '0.5em' }}>
            <span title={time.toFormat('ff')}>{`${time.toRelative()}`}</span>
            {isWarning && <WarningIcon color={palette.warning.main} />}
          </span>
        </div>
      </div>
      {!!actions.length && (
        <div className={classes.actions}>
          {actions?.includes?.(VM_ACTIONS.SCHED_ACTION_UPDATE) && (
            <Actions.UpdateSchedAction schedule={schedule} name={titleAction} />
          )}
          {actions?.includes?.(VM_ACTIONS.SCHED_ACTION_DELETE) && (
            <Actions.DeleteSchedAction schedule={schedule} name={titleAction} />
          )}
        </div>
      )}
    </Paper>
  )
}

SchedulingItem.propTypes = {
  schedule: PropTypes.object.isRequired,
  actions: PropTypes.arrayOf(PropTypes.string),
}

SchedulingItem.displayName = 'SchedulingItem'

export default SchedulingItem
