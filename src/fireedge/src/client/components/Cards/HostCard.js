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
import PropTypes from 'prop-types'
import { memo, ReactElement } from 'react'

import { Typography } from '@mui/material'
import { ModernTv, Server } from 'iconoir-react'

import { Tr } from 'client/components/HOC'
import {
  LinearProgressWithLabel,
  StatusChip,
  StatusCircle,
} from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import { Host, HOST_THRESHOLD, T } from 'client/constants'
import { getAllocatedInfo, getState } from 'client/models/Host'

const HostCard = memo(
  /**
   * @param {object} props - Props
   * @param {Host} props.host - Host resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} props.actions - Actions
   * @returns {ReactElement} - Card
   */
  ({ host, rootProps, actions }) => {
    const classes = rowStyles()
    const { ID, NAME, IM_MAD, VM_MAD, HOST_SHARE, CLUSTER } = host

    const {
      percentCpuUsed,
      percentCpuLabel,
      percentMemUsed,
      percentMemLabel,
      alertCpu,
      alertMemory,
    } = getAllocatedInfo(host)

    const runningVms = HOST_SHARE?.RUNNING_VMS || 0
    const totalVms = [host?.VMS?.ID ?? []].flat().length || 0
    const { color: stateColor, name: stateName } = getState(host)

    const labels = [...new Set([IM_MAD, VM_MAD])]

    return (
      <div {...rootProps} data-cy={`host-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span">
              {NAME}
            </Typography>
            <span className={classes.labels}>
              {labels.map((label) => (
                <StatusChip key={label} text={label} />
              ))}
            </span>
          </div>
          <div className={classes.caption}>
            <span>{`#${ID}`}</span>
            <span data-cy="cluster" title={`Cluster: ${CLUSTER}`}>
              <Server />
              <span>{` ${CLUSTER}`}</span>
            </span>
            <span title={`Running VMs: ${runningVms} / ${totalVms}`}>
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
            alert={alertCpu}
          />
          <LinearProgressWithLabel
            value={percentMemUsed}
            high={HOST_THRESHOLD.MEMORY.high}
            low={HOST_THRESHOLD.MEMORY.low}
            label={percentMemLabel}
            title={`${Tr(T.AllocatedMemory)}`}
            alert={alertMemory}
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
}

HostCard.displayName = 'HostCard'

export default HostCard
