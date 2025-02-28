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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { useCallback, useMemo } from 'react'

import { ImageAPI, oneApi, useAuth } from '@FeaturesModule'
import MultipleTags from '@modules/components/MultipleTags'
import { Typography, useTheme } from '@mui/material'
import {
  Db as DatastoreIcon,
  Group,
  Lock,
  ModernTv,
  Pin as PersistentIcon,
  User,
} from 'iconoir-react'

import { T } from '@ConstantsModule'
import {
  getColorFromString,
  getImageState,
  getUniqueLabels,
  jsonToXml,
  timeFromMilliseconds,
} from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import { StatusChip, StatusCircle } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import Timer from '@modules/components/Timer'
import { prettyBytes } from '@UtilsModule'

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
  const [update] = ImageAPI.useUpdateImageMutation()
  const { labels: userLabels } = useAuth()

  const theme = useTheme()
  const classes = useMemo(() => rowStyles(theme), [theme])
  const {
    id: ID,
    name: NAME,
    UNAME,
    GNAME,
    REGTIME,
    TYPE,
    PERSISTENT,
    locked,
    DATASTORE,
    SIZE,
    RUNNING_VMS,
    label: LABELS = [],
  } = value

  const state = oneApi.endpoints.getImages.useQueryState(undefined, {
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

  const labels = [...new Set([TYPE])].filter(Boolean)

  const { color: stateColor, name: stateName } = getImageState(original)

  const time = timeFromMilliseconds(+REGTIME)

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
          {locked && <Lock data-cy="lock" />}
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
          <span title={+PERSISTENT ? Tr(T.Persistent) : Tr(T.NonPersistent)}>
            <PersistentIcon />
            <span>{+PERSISTENT ? Tr(T.Persistent) : Tr(T.NonPersistent)}</span>
          </span>
          <span title={`${Tr(T.VMs)}: ${RUNNING_VMS}`}>
            <ModernTv />
            <span>{`${RUNNING_VMS}`}</span>
          </span>
          <span title={`${Tr(T.Size)}: ${SIZE}`}>
            <span>{`${prettyBytes(+SIZE ?? 0, 'MB')}`}</span>
          </span>
        </div>
      </div>
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
