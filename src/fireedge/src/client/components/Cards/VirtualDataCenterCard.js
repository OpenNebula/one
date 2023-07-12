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
import { ReactElement, memo, useMemo } from 'react'

import { Typography } from '@mui/material'
import {
  Server as ClusterIcon,
  Db as DatastoreIcon,
  Group as GroupIcon,
  HardDrive as HostIcon,
  Network as VNetIcon,
} from 'iconoir-react'

import MultipleTags from 'client/components/MultipleTags'
import { useViews } from 'client/features/Auth'

import { Tr } from 'client/components/HOC'
import { StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import { ACTIONS, ALL_SELECTED, RESOURCE_NAMES, T, VDC } from 'client/constants'
import COLOR from 'client/constants/color'
import { getColorFromString, getUniqueLabels } from 'client/models/Helper'

const isAllSelected = (resourceArray) =>
  resourceArray.length === 1 && resourceArray[0] === ALL_SELECTED

const VirtualDataCenterCard = memo(
  /**
   * @param {object} props - Props
   * @param {VDC} props.template - Virtual Data Center resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @returns {ReactElement} - Card
   */
  ({ template, rootProps, onClickLabel, onDeleteLabel }) => {
    const classes = rowStyles()
    const { [RESOURCE_NAMES.VDC]: vdcView } = useViews()

    const enableEditLabels =
      vdcView?.actions?.[ACTIONS.EDIT_LABELS] === true && !!onDeleteLabel

    const {
      ID,
      NAME,
      GROUPS,
      CLUSTERS,
      HOSTS,
      DATASTORES,
      VNETS,
      TEMPLATE: { LABELS },
    } = template

    const groupsCount = useMemo(() => {
      const { ID: groupsIds = [] } = GROUPS
      const groupsArray = Array.isArray(groupsIds) ? groupsIds : [groupsIds]

      return groupsArray.length
    }, [GROUPS.ID])

    const clustersCount = useMemo(() => {
      const { CLUSTER: clustersInfo = [] } = CLUSTERS
      const clustersArray = (
        Array.isArray(clustersInfo) ? clustersInfo : [clustersInfo]
      ).map((cluster) => cluster.CLUSTER_ID)

      return isAllSelected(clustersArray) ? T.All : clustersArray.length
    }, [CLUSTERS.CLUSTER])

    const hostsCount = useMemo(() => {
      const { HOST: hostsInfo = [] } = HOSTS
      const hostsArray = (
        Array.isArray(hostsInfo) ? hostsInfo : [hostsInfo]
      ).map((host) => host.HOST_ID)

      return isAllSelected(hostsArray) ? T.All : hostsArray.length
    }, [HOSTS.HOST])

    const datastoresCount = useMemo(() => {
      const { DATASTORE: datastoresInfo = [] } = DATASTORES
      const datastoresArray = (
        Array.isArray(datastoresInfo) ? datastoresInfo : [datastoresInfo]
      ).map((ds) => ds.DATASTORE_ID)

      return isAllSelected(datastoresArray) ? T.All : datastoresArray.length
    }, [DATASTORES.DATASTORE])

    const vnetsCount = useMemo(() => {
      const { VNET: vnetsInfo = [] } = VNETS
      const vnetsArray = (
        Array.isArray(vnetsInfo) ? vnetsInfo : [vnetsInfo]
      ).map((vnet) => vnet.VNET_ID)

      return isAllSelected(vnetsArray) ? T.All : vnetsArray.length
    }, [VNETS.VNET])

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).map((label) => ({
          text: label,
          stateColor: getColorFromString(label),
          onClick: onClickLabel,
          onDelete: enableEditLabels && onDeleteLabel,
        })),
      [LABELS, enableEditLabels, onClickLabel, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`vdc-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={COLOR.success.main} />
            <Typography component="span">{NAME}</Typography>
            <span className={classes.labels}>
              <MultipleTags tags={labels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span>{`#${ID}`}</span>
            <span title={`${Tr(T.Groups)}: ${groupsCount}`}>
              <GroupIcon />
              <span>{` ${groupsCount}`}</span>
            </span>
            <span title={`${Tr(T.Clusters)}: ${clustersCount}`}>
              <ClusterIcon />
              <span>{` ${clustersCount}`}</span>
            </span>
            <span title={`${Tr(T.Hosts)}: ${hostsCount}`}>
              <HostIcon />
              <span>{` ${hostsCount}`}</span>
            </span>
            <span title={`${Tr(T.Datastores)}: ${datastoresCount}`}>
              <DatastoreIcon />
              <span>{` ${datastoresCount}`}</span>
            </span>
            <span title={`${Tr(T.VirtualNetworks)}: ${vnetsCount}`}>
              <VNetIcon />
              <span>{` ${vnetsCount}`}</span>
            </span>
          </div>
        </div>
      </div>
    )
  }
)

VirtualDataCenterCard.propTypes = {
  template: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
}

VirtualDataCenterCard.displayName = 'VirtualDataCenterCard'

export default VirtualDataCenterCard
