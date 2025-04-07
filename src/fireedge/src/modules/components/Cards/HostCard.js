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
import MultipleTags from '@modules/components/MultipleTagsCard'
import { Typography, useTheme } from '@mui/material'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { memo, ReactElement, useMemo } from 'react'
import { ModernTv, Server } from 'iconoir-react'
import { Tr } from '@modules/components/HOC'
import {
  LinearProgressWithLabel,
  StatusChip,
  StatusCircle,
} from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import {
  getAllocatedInfo,
  getColorFromString,
  getHostState,
} from '@ModelsModule'
import { Host, HOST_THRESHOLD, T, RESOURCE_NAMES } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import { getResourceLabels } from '@UtilsModule'

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
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { labels } = useAuth()
    const LABELS = getResourceLabels(labels, host?.ID, RESOURCE_NAMES.HOST)
    const { ID, NAME, IM_MAD, VM_MAD, HOST_SHARE, CLUSTER } = host

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
    const { color: stateColor, name: stateName } = getHostState(host)

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
              <MultipleTags limitTags={1} tags={userLabels} />
              <MultipleTags limitTags={1} tags={groupLabels} />
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
        <div className={clsx(classes.secondary, classes.bars)}>
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
