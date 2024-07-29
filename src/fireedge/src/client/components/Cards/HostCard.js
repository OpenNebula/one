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
import { memo, ReactElement, useMemo } from 'react'
import MultipleTags from 'client/components/MultipleTags'

import { Typography } from '@mui/material'
import { ModernTv, Server } from 'iconoir-react'

import { Tr } from 'client/components/HOC'
import {
  LinearProgressWithLabel,
  StatusChip,
  StatusCircle,
} from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import { getColorFromString, getUniqueLabels } from 'client/models/Helper'

import { Host, HOST_THRESHOLD, T } from 'client/constants'
import { getAllocatedInfo, getState } from 'client/models/Host'
import { useAuth } from 'client/features/Auth'

const HostCard = memo(
  /**
   * @param {object} props - Props
   * @param {Host} props.host - Host resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} props.actions - Actions
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @returns {ReactElement} - Card
   */
  ({ host, rootProps, actions, onClickLabel, onDeleteLabel }) => {
    const classes = rowStyles()
    const { labels: userLabels } = useAuth()
    const {
      ID,
      NAME,
      IM_MAD,
      VM_MAD,
      HOST_SHARE,
      CLUSTER,
      TEMPLATE: { LABELS } = {},
    } = host

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).reduce((acc, label) => {
          if (userLabels?.includes(label)) {
            acc.push({
              text: label,
              dataCy: `label-${label}`,
              stateColor: getColorFromString(label),
              onClick: onClickLabel,
              onDelete: onDeleteLabel,
            })
          }

          return acc
        }, []),
      [LABELS, onClickLabel, onDeleteLabel]
    )

    const {
      percentCpuUsed,
      percentCpuLabel,
      percentMemUsed,
      percentMemLabel,
      colorCpu,
      colorMem,
    } = getAllocatedInfo(host)

    const runningVms = HOST_SHARE?.RUNNING_VMS || 0
    const totalVms = [host?.VMS?.ID ?? []].flat().length || 0
    const { color: stateColor, name: stateName } = getState(host)

    const statusLabels = [...new Set([IM_MAD, VM_MAD])]

    return (
      <div {...rootProps} data-cy={`host-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span">
              {NAME}
            </Typography>
            <span className={classes.statusLabels}>
              {statusLabels.map((label) => (
                <StatusChip key={label} text={label} />
              ))}
            </span>
            <span className={classes.labels}>
              <MultipleTags tags={labels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span>{`#${ID}`}</span>
            <span data-cy="cluster" title={`${Tr(T.Cluster)}: ${CLUSTER}`}>
              <Server />
              <span>{` ${CLUSTER}`}</span>
            </span>
            <span title={`${Tr(T.RunningVMs)}: ${runningVms} / ${totalVms}`}>
              <ModernTv />
              <span>{` ${runningVms} / ${totalVms}`}</span>
            </span>
          </div>
        </div>
        <div className={classes.secondary}>
          <LinearProgressWithLabel
            value={percentCpuUsed}
            high={HOST_THRESHOLD.CPU.high}
            low={HOST_THRESHOLD.CPU.low}
            label={percentCpuLabel}
            title={`${Tr(T.AllocatedCpu)}`}
            color={colorCpu}
          />
          <LinearProgressWithLabel
            value={percentMemUsed}
            high={HOST_THRESHOLD.MEMORY.high}
            low={HOST_THRESHOLD.MEMORY.low}
            label={percentMemLabel}
            title={`${Tr(T.AllocatedMemory)}`}
            color={colorMem}
          />
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

HostCard.propTypes = {
  host: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  actions: PropTypes.any,
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
}

HostCard.displayName = 'HostCard'

export default HostCard
