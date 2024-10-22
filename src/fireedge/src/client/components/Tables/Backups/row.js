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
import { useAuth } from 'client/features/Auth'
import imageApi, { useUpdateImageMutation } from 'client/features/OneApi/image'
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { useCallback, useMemo } from 'react'

import { Typography } from '@mui/material'
import MultipleTags from 'client/components/MultipleTags'
import {
  getColorFromString,
  getUniqueLabels,
  jsonToXml,
} from 'client/models/Helper'
import {
  Db as DatastoreIcon,
  Archive as DiskTypeIcon,
  Group,
  Lock,
  ModernTv,
  Pin as PersistentIcon,
  User,
} from 'iconoir-react'

import { Tr } from 'client/components/HOC'
import { StatusChip, StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import Timer from 'client/components/Timer'
import { T } from 'client/constants'

import * as Helper from 'client/models/Helper'
import * as ImageModel from 'client/models/Image'

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
  const [update] = useUpdateImageMutation()
  const { labels: userLabels } = useAuth()

  const state = imageApi.endpoints.getImages.useQueryState(undefined, {
    selectFromResult: ({ data = [] }) =>
      data.find((image) => +image.ID === +original.ID),
  })

  const memoImage = useMemo(() => state ?? original, [state, original])

  const handleDeleteLabel = useCallback(
    (label) => {
      const currentLabels = memoImage.TEMPLATE?.LABELS?.split(',')
      const newLabels = currentLabels.filter((l) => l !== label).join(',')
      const newImageTemplate = { ...memoImage.TEMPLATE, LABELS: newLabels }
      const templateXml = jsonToXml(newImageTemplate)

      update({ id: original.ID, template: templateXml, replace: 0 })
    },
    [memoImage.TEMPLATE?.LABELS, update]
  )

  const classes = rowStyles()
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
    label: LABELS = [],
  } = value

  const {
    BACKUP_INCREMENTS: { INCREMENT = undefined },
  } = original

  const BACKUP_TYPE = INCREMENT ? T.Incremental : T.Full
  const labels = [...new Set([BACKUP_TYPE])].filter(Boolean)

  const { color: stateColor, name: stateName } = ImageModel.getState(original)

  const time = Helper.timeFromMilliseconds(+REGTIME)

  const multiTagLabels = useMemo(
    () =>
      getUniqueLabels(LABELS).reduce((acc, label) => {
        if (userLabels?.includes(label)) {
          acc.push({
            text: label,
            dataCy: `label-${label}`,
            stateColor: getColorFromString(label),
            onClick: onClickLabel,
            onDelete: handleDeleteLabel,
          })
        }

        return acc
      }, []),
    [LABELS, handleDeleteLabel, onClickLabel]
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
            <MultipleTags tags={multiTagLabels} />
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
