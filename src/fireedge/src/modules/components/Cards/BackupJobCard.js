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
import { ReactElement, memo, useMemo } from 'react'

import { Typography, useTheme } from '@mui/material'

import { getColorFromString, timeFromMilliseconds } from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import MultipleTags from '@modules/components/MultipleTagsCard'
import { StatusCircle } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'

import { getResourceLabels } from '@UtilsModule'
import { COLOR, RESOURCE_NAMES, T } from '@ConstantsModule'
import Timer from '@modules/components/Timer'
import { Group, HighPriority, Lock, User } from 'iconoir-react'

import { useAuth } from '@FeaturesModule'
import PropTypes from 'prop-types'

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
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { labels } = useAuth()

    const LABELS = getResourceLabels(
      labels,
      template?.ID,
      RESOURCE_NAMES.BACKUPJOBS
    )

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

    const userLabels = useMemo(
      () =>
        LABELS?.user?.map((label) => ({
          text: label?.replace(/\$/g, ''),
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
          onClick: onClickLabel,
        })) || [],
      [LABELS, onClickLabel]
    )

    const groupLabels = useMemo(
      () =>
        Object.entries(LABELS?.group || {}).flatMap(([group, gLabels]) =>
          gLabels.map((gLabel) => ({
            text: gLabel?.replace(/\$/g, ''),
            dataCy: `group-label-${group}-${gLabel}`,
            stateColor: getColorFromString(gLabel),
            onClick: onClickLabel,
          }))
        ),
      [LABELS, onClickLabel]
    )

    return (
      <div {...rootProps} data-cy={`backupjob-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={status.color} tooltip={Tr(status.tooltip)} />
            <Typography component="span">{NAME}</Typography>
            <span className={classes.labels}>
              {LOCK && <Lock data-cy="lock" />}
              <MultipleTags limitTags={1} tags={userLabels} />
              <MultipleTags limitTags={1} tags={groupLabels} />
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
