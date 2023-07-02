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
import { ReactElement, memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Lock, User, Group, Cart } from 'iconoir-react'
import { Typography } from '@mui/material'

import { useViews } from 'client/features/Auth'
import MultipleTags from 'client/components/MultipleTags'
import Timer from 'client/components/Timer'
import { StatusCircle, StatusChip } from 'client/components/Status'
import { Tr } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'

import { getState, getType } from 'client/models/MarketplaceApp'
import {
  timeFromMilliseconds,
  getUniqueLabels,
  getColorFromString,
} from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import {
  T,
  MarketplaceApp,
  MARKETPLACE_APP_ACTIONS,
  RESOURCE_NAMES,
} from 'client/constants'

const MarketplaceAppCard = memo(
  /**
   * @param {object} props - Props
   * @param {MarketplaceApp} props.app - Marketplace App resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @returns {ReactElement} - Card
   */
  ({ app, rootProps, onClickLabel, onDeleteLabel }) => {
    const classes = rowStyles()
    const { [RESOURCE_NAMES.VM]: vmView } = useViews()

    const enableEditLabels =
      vmView?.actions?.[MARKETPLACE_APP_ACTIONS.EDIT_LABELS] === true &&
      !!onDeleteLabel

    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      LOCK,
      REGTIME,
      MARKETPLACE,
      ZONE_ID,
      SIZE,
      TEMPLATE: { LABELS } = {},
    } = app

    const state = useMemo(() => getState(app), [app?.STATE])
    const { color: stateColor, name: stateName } = state

    const time = useMemo(() => timeFromMilliseconds(+REGTIME), [REGTIME])
    const type = useMemo(() => getType(app), [app?.TYPE])

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).map((label) => ({
          text: label,
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
          onClick: onClickLabel,
          onDelete: enableEditLabels && onDeleteLabel,
        })),
      [LABELS, enableEditLabels, onClickLabel, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`app-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span">
              {NAME}
            </Typography>
            {LOCK && <Lock />}
            <span className={classes.labels}>
              <StatusChip text={type} />
              <MultipleTags tags={labels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${ID}`}</span>
            <span title={useMemo(() => time.toFormat('ff'), [REGTIME])}>
              <Timer translateWord={T.RegisteredAt} initial={time} />
            </span>
            <span title={`${Tr(T.Owner)}: ${UNAME}`}>
              <User />
              <span data-cy="owner">{UNAME}</span>
            </span>
            <span title={`${Tr(T.Group)}: ${GNAME}`}>
              <Group />
              <span data-cy="group">{GNAME}</span>
            </span>
            <span title={`${Tr(T.Marketplace)}: ${MARKETPLACE}`}>
              <Cart />
              <span data-cy="marketplace">{MARKETPLACE}</span>
            </span>
          </div>
        </div>
        <div className={classes.secondary}>
          <span className={classes.labels}>
            <StatusChip text={`${Tr(T.Zone)} ${ZONE_ID}`} />
            <StatusChip text={prettyBytes(+SIZE, 'MB')} />
          </span>
        </div>
      </div>
    )
  }
)

MarketplaceAppCard.propTypes = {
  app: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

MarketplaceAppCard.displayName = 'MarketplaceAppCard'

export default MarketplaceAppCard
