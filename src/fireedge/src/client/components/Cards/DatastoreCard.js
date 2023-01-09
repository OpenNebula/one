/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { memo, ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  User,
  Group,
  Lock,
  Cloud,
  Server,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'
import { Box, Typography, Tooltip } from '@mui/material'

import {
  StatusCircle,
  StatusChip,
  LinearProgressWithLabel,
} from 'client/components/Status'
import { Tr } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'

import { getState, getType, getCapacityInfo } from 'client/models/Datastore'
import { getErrorMessage } from 'client/models/Helper'
import { T, Datastore, DS_THRESHOLD } from 'client/constants'

const DatastoreCard = memo(
  /**
   * @param {object} props - Props
   * @param {Datastore} props.datastore - Datastore resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} props.actions - Actions
   * @returns {ReactElement} - Card
   */
  ({ datastore: ds, rootProps, actions }) => {
    const classes = rowStyles()

    const { ID, NAME, UNAME, GNAME, CLUSTERS, LOCK, PROVISION_ID } = ds

    const type = getType(ds)
    const { color: stateColor, name: stateName } = getState(ds)
    const error = useMemo(() => getErrorMessage(ds), [ds])
    const capacity = useMemo(() => getCapacityInfo(ds), [ds])
    const { percentOfUsed, percentLabel } = capacity

    const clusters = useMemo(
      () => [CLUSTERS?.ID ?? []].flat().join(),
      [CLUSTERS?.ID]
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
            <span className={classes.labels}>
              {LOCK && <Lock />}
              <StatusChip text={type} />
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
            <span title={`${Tr(T.Clusters)}: ${clusters}`}>
              <Server />
              <span>{` ${clusters}`}</span>
            </span>
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
        {actions && <div className={classes.actions}>{actions}</div>}
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
}

DatastoreCard.displayName = 'DatastoreCard'

export default DatastoreCard
