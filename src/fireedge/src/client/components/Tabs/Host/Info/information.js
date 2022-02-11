/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { generatePath } from 'react-router'

import { useRenameHostMutation } from 'client/features/OneApi/host'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import { StatusChip, LinearProgressWithLabel } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'

import { getState, getDatastores, getAllocatedInfo } from 'client/models/Host'
import { getCapacityInfo } from 'client/models/Datastore'
import { T, VM_ACTIONS, Host } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routesOne'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Host} props.host - Host resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ host = {}, actions }) => {
  const [renameHost] = useRenameHostMutation()
  const { data: datastores = [] } = useGetDatastoresQuery()

  const { ID, NAME, IM_MAD, VM_MAD, CLUSTER_ID, CLUSTER } = host
  const { name: stateName, color: stateColor } = getState(host)
  const { percentCpuUsed, percentCpuLabel, percentMemUsed, percentMemLabel } =
    getAllocatedInfo(host)

  const handleRename = async (_, newName) => {
    await renameHost({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(VM_ACTIONS.RENAME),
      handleEdit: handleRename,
      dataCy: 'name',
    },
    {
      name: T.State,
      value: (
        <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
      ),
    },
    {
      name: T.Cluster,
      value: `#${CLUSTER_ID} ${CLUSTER}`,
      link:
        !Number.isNaN(+CLUSTER_ID) &&
        generatePath(PATH.INFRASTRUCTURE.CLUSTERS.DETAIL, { id: CLUSTER_ID }),
      dataCy: 'clusterid',
    },
    { name: T.IM_MAD, value: IM_MAD, dataCy: 'immad' },
    { name: T.VM_MAD, value: VM_MAD, dataCy: 'vmmad' },
  ]

  const capacity = [
    {
      name: T.AllocatedMemory,
      value: (
        <LinearProgressWithLabel
          value={percentMemUsed}
          label={percentMemLabel}
        />
      ),
    },
    {
      name: T.AllocatedCpu,
      value: (
        <LinearProgressWithLabel
          value={percentCpuUsed}
          label={percentCpuLabel}
        />
      ),
    },
  ]

  const infoFromDatastores = getDatastores(host).map((dsHost) => {
    const { percentOfUsed, percentLabel } = getCapacityInfo(dsHost)
    const dsName = datastores.find((ds) => +ds.ID === +dsHost.ID)?.NAME ?? '--'

    return {
      name: `#${dsHost.ID} ${dsName}`,
      dataCy: `ds-id-${dsHost.ID}`,
      value: (
        <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
      ),
    }
  })

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ style: { gridRow: 'span 2' } }}
      />
      <List title={T.Capacity} list={capacity} />
      <List title={T.Datastores} list={infoFromDatastores} />
    </>
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  host: PropTypes.object,
}

export default InformationPanel
