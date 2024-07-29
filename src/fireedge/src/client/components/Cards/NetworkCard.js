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
import { memo, useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import {
  User,
  Group,
  Lock,
  Server,
  Cloud,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'
import { Box, Stack, Typography, Tooltip } from '@mui/material'

import { useAuth, useViews } from 'client/features/Auth'
import MultipleTags from 'client/components/MultipleTags'
import {
  StatusCircle,
  StatusChip,
  LinearProgressWithLabel,
} from 'client/components/Status'
import { Tr } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'

import {
  getState,
  getLeasesInfo,
  getVNManager,
} from 'client/models/VirtualNetwork'
import {
  getColorFromString,
  getUniqueLabels,
  getErrorMessage,
} from 'client/models/Helper'
import {
  VirtualNetwork,
  T,
  ACTIONS,
  RESOURCE_NAMES,
  VNET_THRESHOLD,
} from 'client/constants'

const NetworkCard = memo(
  /**
   * @param {object} props - Props
   * @param {VirtualNetwork} props.network - Network resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @param {ReactElement} [props.actions] - Actions
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @returns {ReactElement} - Card
   */
  ({ network, rootProps, actions, onClickLabel, onDeleteLabel }) => {
    const classes = rowStyles()
    const { labels: userLabels } = useAuth()
    const { [RESOURCE_NAMES.VM]: vmView } = useViews()

    const enableEditLabels =
      vmView?.actions?.[ACTIONS.EDIT_LABELS] === true && !!onDeleteLabel

    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      LOCK,
      CLUSTERS,
      TEMPLATE: { PROVISION, LABELS } = {},
    } = network

    const provisionId = PROVISION?.ID
    const { color: stateColor, name: stateName } = getState(network)
    const error = useMemo(() => getErrorMessage(network), [network])
    const vnMad = useMemo(() => getVNManager(network), [network?.VN_MAD])
    const leasesInfo = useMemo(() => getLeasesInfo(network), [network])
    const { percentOfUsed, percentLabel } = leasesInfo

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
      [LABELS, enableEditLabels, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`network-${ID}`}>
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
              {vnMad && <StatusChip text={vnMad} />}
              {LOCK && <Lock />}
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
            {!!clusters?.length && (
              <span title={`${Tr(T.Clusters)}`}>
                <Server />
                <Stack direction="row" justifyContent="end" alignItems="center">
                  <MultipleTags tags={clusters} />
                </Stack>
              </span>
            )}
            {provisionId && (
              <span title={`${Tr(T.ProvisionId)}: #${provisionId}`}>
                <Cloud />
                <span>{` ${provisionId}`}</span>
              </span>
            )}
          </div>
        </div>
        <div className={classes.secondary}>
          <LinearProgressWithLabel
            value={percentOfUsed}
            high={VNET_THRESHOLD.LEASES.high}
            low={VNET_THRESHOLD.LEASES.low}
            label={percentLabel}
            title={`${Tr(T.Used)} / ${Tr(T.TotalLeases)}`}
          />
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

NetworkCard.propTypes = {
  network: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
