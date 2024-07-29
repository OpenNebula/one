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
import { memo, ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  User,
  Group,
  Server,
  WarningCircledOutline as WarningIcon,
  MinusPinAlt as ZoneIcon,
} from 'iconoir-react'
import { Box, Typography, Tooltip } from '@mui/material'

import {
  StatusCircle,
  StatusChip,
  LinearProgressWithLabel,
} from 'client/components/Status'
import { Tr } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'

import { getState, getCapacityInfo } from 'client/models/Datastore'
import { getErrorMessage } from 'client/models/Helper'
import { T, Marketplace, MARKET_THRESHOLD } from 'client/constants'

const MarketplaceCard = memo(
  /**
   * @param {object} props - Props
   * @param {Marketplace} props.market - Marketplace resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} props.actions - Actions
   * @returns {ReactElement} - Card
   */
  ({ market, rootProps, actions }) => {
    const classes = rowStyles()

    const { ID, NAME, UNAME, GNAME, MARKET_MAD, MARKETPLACEAPPS, ZONE_ID } =
      market

    const { color: stateColor, name: stateName } = getState(market)
    const error = useMemo(() => getErrorMessage(market), [market])
    const capacity = useMemo(() => getCapacityInfo(market), [market])
    const { percentOfUsed, percentLabel } = capacity

    const apps = useMemo(
      () => [MARKETPLACEAPPS?.ID ?? []].flat().length || 0,
      [MARKETPLACEAPPS?.ID]
    )

    return (
      <div {...rootProps} data-cy={`marketplace-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span">
              {NAME}
            </Typography>
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
              <StatusChip text={MARKET_MAD} />
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
            <span title={`${Tr(T.Apps)}: ${apps}`}>
              <Server />
              <span>{` ${apps}`}</span>
            </span>
            <span title={`${Tr(T.Zone)}: ${ZONE_ID}`}>
              <ZoneIcon />
              <span>{` ${ZONE_ID}`}</span>
            </span>
          </div>
        </div>
        <div className={classes.secondary}>
          <LinearProgressWithLabel
            value={percentOfUsed}
            label={percentLabel}
            high={MARKET_THRESHOLD.CAPACITY.high}
            low={MARKET_THRESHOLD.CAPACITY.low}
            title={Tr(T.UsedOfTotal)}
          />
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

MarketplaceCard.propTypes = {
  market: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  actions: PropTypes.any,
}

MarketplaceCard.displayName = 'MarketplaceCard'

export default MarketplaceCard
