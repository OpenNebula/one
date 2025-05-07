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
import { Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'

import { Cart, Group, Lock, User } from 'iconoir-react'

import { useAuth } from '@FeaturesModule'
import { Tr } from '@modules/components/HOC'
import MultipleTags from '@modules/components/MultipleTagsCard'
import { StatusChip, StatusCircle } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import { getResourceLabels, prettyBytes } from '@UtilsModule'

import { MarketplaceApp, RESOURCE_NAMES, T } from '@ConstantsModule'
import {
  getColorFromString,
  getMarketplaceAppState,
  getMarketplaceAppType,
} from '@ModelsModule'

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
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { labels } = useAuth()
    const LABELS = getResourceLabels(labels, app?.ID, RESOURCE_NAMES.APP)

    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      LOCK,
      VERSION,
      MARKETPLACE,
      ZONE_ID,
      SIZE,
      TEMPLATE: { ARCHITECTURE = '', HYPERVISOR = '' },
    } = app

    const state = useMemo(() => getMarketplaceAppState(app), [app?.STATE])
    const { color: stateColor, name: stateName } = state

    const type = useMemo(() => getMarketplaceAppType(app), [app?.TYPE])

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

              <MultipleTags limitTags={1} tags={userLabels} />
              <MultipleTags limitTags={1} tags={groupLabels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${ID}`}</span>
            <span title={`${Tr(T.Version)}: ${VERSION}`}>
              <span data-cy="version">
                {Tr(T.Version)}: {VERSION}
              </span>
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
        <div className={classes.primary}>
          <span className={classes.labels}>
            {ARCHITECTURE && <StatusChip text={ARCHITECTURE} />}
            {HYPERVISOR && <StatusChip text={HYPERVISOR} />}
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
