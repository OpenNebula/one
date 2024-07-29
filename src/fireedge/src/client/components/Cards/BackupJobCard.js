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
import { ReactElement, memo, useMemo } from 'react'

import { Typography } from '@mui/material'

import { Tr } from 'client/components/HOC'
import { StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import MultipleTags from 'client/components/MultipleTags'
import {
  getColorFromString,
  getUniqueLabels,
  timeFromMilliseconds,
} from 'client/models/Helper'

import Timer from 'client/components/Timer'
import { T } from 'client/constants'
import { Group, HighPriority, Lock, User } from 'iconoir-react'

import COLOR from 'client/constants/color'
import PropTypes from 'prop-types'
import { useAuth } from 'client/features/Auth'

const haveValues = function (object) {
  return Object.values(object).length > 0
}

const BackupJobCard = memo(
  /**
   * @param {object} props - Props
   * @param {object} props.template - BackupJob template
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @returns {ReactElement} - Card
   */
  ({ template, rootProps, onClickLabel, onDeleteLabel }) => {
    const classes = rowStyles()
    const { labels: userLabels } = useAuth()

    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      OUTDATED_VMS,
      BACKING_UP_VMS,
      ERROR_VMS,
      PRIORITY,
      LAST_BACKUP_TIME,
      LOCK,
      TEMPLATE: { LABELS } = {},
    } = template

    const time = useMemo(() => {
      const LastBackupTime = +LAST_BACKUP_TIME
      if (LastBackupTime > 0) {
        const timer = timeFromMilliseconds(LastBackupTime)

        return (
          <span title={timer.toFormat('ff')}>
            <Timer translateWord={T.LastBackupTime} initial={timer} />
          </span>
        )
      } else {
        return ''
      }
    }, [LAST_BACKUP_TIME])

    const status = useMemo(() => {
      const completed = {
        color: COLOR.success.main,
        tooltip: T.Completed,
      }
      const noStarted = {
        color: COLOR.warning.main,
        tooltip: T.NotStartedYet,
      }

      const error = {
        color: COLOR.error.main,
        tooltip: T.Error,
      }

      const onGoing = {
        color: COLOR.info.main,
        tooltip: T.OnGoing,
      }

      if (haveValues(ERROR_VMS)) {
        return error
      }

      if (!haveValues(OUTDATED_VMS) && !haveValues(BACKING_UP_VMS)) {
        return LAST_BACKUP_TIME === '0' ? noStarted : completed
      }

      if (haveValues(OUTDATED_VMS)) {
        return completed
      }

      if (haveValues(BACKING_UP_VMS)) {
        return onGoing
      }
    }, [OUTDATED_VMS, BACKING_UP_VMS, ERROR_VMS, LAST_BACKUP_TIME])

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).reduce((acc, label) => {
          if (userLabels?.includes(label)) {
            acc.push({
              text: label,
              dataCy: `label-${label}`,
              stateColor: getColorFromString(label),
              onClick: onClickLabel,
              onDelete: onDeleteLabel,
            })
          }

          return acc
        }, []),
      [LABELS, onClickLabel, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`backupjob-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={status.color} tooltip={Tr(status.tooltip)} />
            <Typography component="span">{NAME}</Typography>
            <span className={classes.labels}>
              {LOCK && <Lock data-cy="lock" />}
              <MultipleTags tags={labels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span>{`#${ID}`}</span>
            <span title={`${Tr(T.Priority)}: ${PRIORITY}`}>
              <HighPriority />
              <span>{` ${PRIORITY}`}</span>
            </span>
            <span title={`${Tr(T.Owner)}: ${UNAME}`}>
              <User />
              <span>{` ${UNAME}`}</span>
            </span>
            <span title={`${Tr(T.Group)}: ${GNAME}`}>
              <Group />
              <span>{` ${GNAME}`}</span>
            </span>
            {time}
          </div>
        </div>
      </div>
    )
  }
)

BackupJobCard.propTypes = {
  template: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
}

BackupJobCard.displayName = 'BackupJobCard'

export default BackupJobCard
