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
import { useAuth } from '@FeaturesModule'
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { useMemo } from 'react'

import { Typography, useTheme } from '@mui/material'
import MultipleTags from '@modules/components/MultipleTags'
import {
  getColorFromString,
  getImageState,
  timeFromMilliseconds,
} from '@ModelsModule'
import { getResourceLabels } from '@UtilsModule'
import {
  Db as DatastoreIcon,
  Archive as DiskTypeIcon,
  Group,
  Lock,
  ModernTv,
  Pin as PersistentIcon,
  User,
} from 'iconoir-react'

import { Tr } from '@modules/components/HOC'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { StatusChip, StatusCircle } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import Timer from '@modules/components/Timer'

const Row = ({
  original,
  value,
  onClickLabel,
  headerList,
  rowDataCy,
  isSelected,
  toggleRowSelected,
  ...props
}) => {
  const { labels } = useAuth()
  const LABELS = getResourceLabels(labels, original?.ID, RESOURCE_NAMES.BACKUP)

  const theme = useTheme()
  const classes = useMemo(() => rowStyles(theme), [theme])
  const {
    id: ID,
    NAME,
    UNAME,
    GNAME,
    REGTIME,
    DISK_TYPE,
    PERSISTENT,
    locked,
    DATASTORE,
    TOTAL_VMS,
    RUNNING_VMS,
  } = value

  const { color: stateColor, name: stateName } = getImageState(original)

  const time = timeFromMilliseconds(+REGTIME)

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
    <div {...props} data-cy={`image-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <StatusCircle color={stateColor} tooltip={stateName} />
          <Typography noWrap component="span" data-cy="name">
            {NAME}
          </Typography>
          {locked && <Lock />}
          <span className={classes.labels}>
            {labels.map((label) => (
              <StatusChip key={label} text={label} />
            ))}
          </span>
          <span className={classes.labels}>
            <MultipleTags limitTags={1} tags={userLabels} />
            <MultipleTags limitTags={1} tags={groupLabels} />
          </span>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={time.toFormat('ff')}>
            <Timer translateWord={T.RegisteredAt} initial={time} />
          </span>
          <span title={`${Tr(T.Owner)}: ${UNAME}`}>
            <User />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`${Tr(T.Group)}: ${GNAME}`}>
            <Group />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`${Tr(T.Datastore)}: ${DATASTORE}`}>
            <DatastoreIcon />
            <span>{` ${DATASTORE}`}</span>
          </span>
          <span
            title={
              PERSISTENT
                ? Tr(T.Persistent).toLowerCase()
                : Tr(T.NonPersistent).toLowerCase()
            }
          >
            <PersistentIcon />
            <span>
              {PERSISTENT
                ? Tr(T.Persistent).toLowerCase()
                : Tr(T.NonPersistent).toLowerCase()}
            </span>
          </span>
          <span title={`${Tr(T.DiskType)}: ${DISK_TYPE.toLowerCase()}`}>
            <DiskTypeIcon />
            <span>{` ${DISK_TYPE.toLowerCase()}`}</span>
          </span>
          <span
            title={`${Tr(T.Running)} / ${Tr(T.Used)} ${Tr(
              T.VMs
            )}: ${RUNNING_VMS} / ${TOTAL_VMS}`}
          >
            <ModernTv />
            <span>{` ${RUNNING_VMS} / ${TOTAL_VMS}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}></div>
    </div>
  )
}

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  onClickLabel: PropTypes.func,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  toggleRowSelected: PropTypes.func,
}

export default Row
