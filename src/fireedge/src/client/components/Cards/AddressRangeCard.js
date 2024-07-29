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
import { Box, Link, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'
import { Link as RouterLink, generatePath } from 'react-router-dom'

import { useViews } from 'client/features/Auth'

import MultipleTags from 'client/components/MultipleTags'
import { LinearProgressWithLabel } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import { PATH } from 'client/apps/sunstone/routesOne'
import { Tr, Translate } from 'client/components/HOC'
import {
  AddressRange,
  RESOURCE_NAMES,
  T,
  VNET_THRESHOLD,
  VirtualNetwork,
} from 'client/constants'
import { getARLeasesInfo } from 'client/models/VirtualNetwork'

const { VNET } = RESOURCE_NAMES

const AddressRangeCard = memo(
  /**
   * @param {object} props - Props
   * @param {VirtualNetwork} props.vnet - Virtual network
   * @param {AddressRange} props.ar - Address Range
   * @param {ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ vnet, ar = {}, actions }) => {
    const classes = rowStyles()

    const { PARENT_NETWORK_ID: parentId } = vnet || {}

    const {
      AR_ID,
      TYPE,
      IPAM_MAD,
      USED_LEASES,
      SIZE,
      MAC,
      MAC_END = '-',
      IP,
      IP_END = '-',
      IP6,
      IP6_END = '-',
      IP6_GLOBAL,
      IP6_GLOBAL_END = '-',
      IP6_ULA,
      IP6_ULA_END = '-',
    } = ar

    const { view, hasAccessToResource } = useViews()
    const canLinkToParent = useMemo(
      () => hasAccessToResource(VNET) && parentId,
      [view, parentId]
    )

    const leasesInfo = useMemo(() => getARLeasesInfo(ar), [ar])
    const { percentOfUsed, percentLabel } = leasesInfo

    const labels = [
      { text: TYPE, dataCy: 'type' },
      IPAM_MAD && { text: IPAM_MAD, dataCy: 'ipam-mad' },
      !USED_LEASES &&
        SIZE && { text: `${Tr(T.Size)}: ${SIZE}`, dataCy: 'size' },
      canLinkToParent && {
        text: (
          <Link
            color="secondary"
            component={RouterLink}
            to={generatePath(PATH.NETWORK.VNETS.DETAIL, { id: parentId })}
          >
            <Translate word={T.ReservedFromVNetId} values={parentId} />
          </Link>
        ),
        dataCy: 'parent',
      },
    ].filter(Boolean)

    return (
      <Box
        data-cy="ar"
        className={classes.root}
        sx={{
          '&:hover': { bgcolor: 'action.hover' },
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" data-cy="id">
              {`#${AR_ID || '-'}`}
            </Typography>
            <span className={classes.labels}>
              <MultipleTags tags={labels} limitTags={labels.length} />
            </span>
          </div>
          <Box
            className={classes.caption}
            sx={{
              flexDirection: 'column',
              alignItems: 'flex-start !important',
              gap: '0.5em !important',
            }}
          >
            {MAC && (
              <span
                data-cy="range-mac"
                title={`${Tr(T.First)}: ${MAC} / ${Tr(T.Last)}: ${MAC_END}`}
              >{`MAC: ${MAC} | ${MAC_END}`}</span>
            )}
            {IP && (
              <span
                data-cy="range-ip"
                title={`${Tr(T.First)}: ${IP} / ${Tr(T.Last)}: ${IP_END}`}
              >{`IP: ${IP} | ${IP_END}`}</span>
            )}
            {IP6 && (
              <span
                data-cy="range-ip6"
                title={`${Tr(T.First)}: ${IP6} / ${Tr(T.Last)}: ${IP6_END}`}
              >{`IP6: ${IP6} | ${IP6_END}`}</span>
            )}
            {IP6_GLOBAL && (
              <span
                data-cy="range-ip6-global"
                title={`${Tr(T.First)}: ${IP6_GLOBAL} / ${Tr(
                  T.Last
                )}: ${IP6_GLOBAL_END}`}
              >{`IP6 GLOBAL: ${IP6_GLOBAL} | ${IP6_GLOBAL_END}`}</span>
            )}
            {IP6_ULA && (
              <span
                data-cy="range-ip6-ula"
                title={`${Tr(T.First)}: ${IP6_ULA} / ${Tr(
                  T.Last
                )}: ${IP6_ULA_END}`}
              >{`IP6 ULA: ${IP6_ULA} | ${IP6_ULA_END}`}</span>
            )}
          </Box>
        </div>
        <div className={classes.secondary}>
          {USED_LEASES && (
            <LinearProgressWithLabel
              value={percentOfUsed}
              high={VNET_THRESHOLD.LEASES.high}
              low={VNET_THRESHOLD.LEASES.low}
              label={percentLabel}
              title={`${Tr(T.Used)} / ${Tr(T.TotalLeases)}`}
            />
          )}
          {actions && <div className={classes.actions}>{actions}</div>}
        </div>
      </Box>
    )
  }
)

AddressRangeCard.propTypes = {
  vnet: PropTypes.object,
  ar: PropTypes.object,
  actions: PropTypes.node,
}

AddressRangeCard.displayName = 'AddressRangeCard'

export default AddressRangeCard
