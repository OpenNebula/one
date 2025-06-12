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
import { Datastore, DS_THRESHOLD, RESOURCE_NAMES, T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'
import MultipleTags from '@modules/components/MultipleTagsCard'
import {
  LinearProgressWithLabel,
  StatusChip,
  StatusCircle,
} from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material'
import clsx from 'clsx'
import {
  Group,
  Lock,
  Server,
  User,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, ReactElement, useMemo } from 'react'

import { useAuth } from '@FeaturesModule'
import {
  getColorFromString,
  getDatastoreCapacityInfo,
  getDatastoreState,
  getDatastoreType,
  getErrorMessage,
} from '@ModelsModule'
import { getResourceLabels } from '@UtilsModule'

const DatastoreCard = memo(
  /**
   * @param {object} props - Props
   * @param {Datastore} props.datastore - Datastore resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @returns {ReactElement} - Card
   */
  ({ datastore: ds, rootProps, onClickLabel, onDeleteLabel }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { labels } = useAuth()
    const LABELS = getResourceLabels(labels, ds?.ID, RESOURCE_NAMES.DATASTORE)

    const { ID, NAME, UNAME, GNAME, CLUSTERS, LOCK } = ds

    const type = getDatastoreType(ds)
    const { color: stateColor, name: stateName } = getDatastoreState(ds)
    const error = useMemo(() => getErrorMessage(ds), [ds])
    const capacity = useMemo(() => getDatastoreCapacityInfo(ds), [ds])
    const { percentOfUsed, percentLabel } = capacity

    const clusters = useMemo(() => [CLUSTERS?.ID ?? []].flat(), [CLUSTERS?.ID])

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
      <div {...rootProps} data-cy={`datastore-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography component="span">{NAME}</Typography>
            {error && (
              <Tooltip
                arrow
                placement="bottom"
                title={<Typography variant="subtitle2">{error}</Typography>}
              >
                <Box color="error.dark" component="span">
                  <WarningIcon />
                </Box>
              </Tooltip>
            )}
            {LOCK && <Lock />}
            <span className={classes.labels}>
              <StatusChip text={type} />
              <MultipleTags limitTags={1} tags={userLabels} />
              <MultipleTags limitTags={1} tags={groupLabels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span>{`#${ID}`}</span>
            <span title={`${Tr(T.Owner)}: ${UNAME}`}>
              <User />
              <span>{` ${UNAME}`}</span>
            </span>
            <span title={`${Tr(T.Group)}: ${GNAME}`}>
              <Group />
              <span>{` ${GNAME}`}</span>
            </span>
            {!!clusters?.length && (
              <span title={`${Tr(T.Clusters)}`}>
                <Server />
                <Stack direction="row" justifyContent="end" alignItems="center">
                  {clusters?.map((cluster, index) => (
                    <span key={index}>{cluster}&nbsp;</span>
                  ))}
                </Stack>
              </span>
            )}
          </div>
        </div>
        <div className={clsx(classes.secondary, classes.bars)}>
          <LinearProgressWithLabel
            value={percentOfUsed}
            label={percentLabel}
            high={DS_THRESHOLD.CAPACITY.high}
            low={DS_THRESHOLD.CAPACITY.low}
            title={Tr(T.UsedOfTotal)}
          />
        </div>
      </div>
    )
  }
)

DatastoreCard.propTypes = {
  datastore: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  actions: PropTypes.any,
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
}

DatastoreCard.displayName = 'DatastoreCard'

export default DatastoreCard
