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
import PropTypes from 'prop-types'
import { useTheme, Box, Stack, Tooltip, Typography } from '@mui/material'
import { memo, ReactElement, useMemo } from 'react'

import MultipleTags from '@modules/components/MultipleTags'
import {
  Cloud,
  Group,
  Lock,
  Server,
  User,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'

import { Tr } from '@modules/components/HOC'
import {
  LinearProgressWithLabel,
  StatusChip,
  StatusCircle,
} from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'

import {
  Datastore,
  DS_THRESHOLD,
  T,
  DATASTORE_ACTIONS,
  RESOURCE_NAMES,
} from '@ConstantsModule'
import {
  getDatastoreCapacityInfo,
  getDatastoreState,
  getDatastoreType,
  getColorFromString,
  getErrorMessage,
  getUniqueLabels,
} from '@ModelsModule'
import { useAuth, useViews } from '@FeaturesModule'

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
    const { labels: userLabels } = useAuth()
    const { [RESOURCE_NAMES.DATASTORE]: dsView } = useViews()

    const enableEditLabels =
      dsView?.actions?.[DATASTORE_ACTIONS.EDIT_LABELS] === true &&
      !!onDeleteLabel

    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      CLUSTERS,
      LOCK,
      PROVISION_ID,
      TEMPLATE: { LABELS } = {},
    } = ds

    const type = getDatastoreType(ds)
    const { color: stateColor, name: stateName } = getDatastoreState(ds)
    const error = useMemo(() => getErrorMessage(ds), [ds])
    const capacity = useMemo(() => getDatastoreCapacityInfo(ds), [ds])
    const { percentOfUsed, percentLabel } = capacity

    const clusters = useMemo(() => [CLUSTERS?.ID ?? []].flat(), [CLUSTERS?.ID])

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).reduce((acc, label) => {
          if (userLabels?.includes(label)) {
            acc.push({
              text: label,
              dataCy: `label-${label}`,
              stateColor: getColorFromString(label),
              onClick: onClickLabel,
              onDelete: enableEditLabels && onDeleteLabel,
            })
          }

          return acc
        }, []),
      [LABELS, enableEditLabels, onClickLabel, onDeleteLabel]
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
              <MultipleTags tags={labels} />
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
            {PROVISION_ID && (
              <span title={`${Tr(T.ProvisionId)}: #${PROVISION_ID}`}>
                <Cloud />
                <span>{` ${PROVISION_ID}`}</span>
              </span>
            )}
            {!!clusters?.length && (
              <span title={`${Tr(T.Clusters)}`}>
                <Server />
                <Stack direction="row" justifyContent="end" alignItems="center">
                  <MultipleTags tags={clusters} />
                </Stack>
              </span>
            )}
          </div>
        </div>
        <div className={classes.secondary}>
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
