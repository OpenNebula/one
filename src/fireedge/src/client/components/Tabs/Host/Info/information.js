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
import { ReactElement } from 'react'
import { generatePath } from 'react-router'

import { LinearProgressWithLabel, StatusChip } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import {
  useRenameHostMutation,
  useUpdateHostMutation,
} from 'client/features/OneApi/host'

import { PATH } from 'client/apps/sunstone/routesOne'
import {
  DS_THRESHOLD,
  HOST_THRESHOLD,
  Host,
  T,
  VM_ACTIONS,
} from 'client/constants'
import { getCapacityInfo } from 'client/models/Datastore'
import { jsonToXml } from 'client/models/Helper'
import { getAllocatedInfo, getDatastores, getState } from 'client/models/Host'

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
  const [updateHost] = useUpdateHostMutation()
  const { data: datastores = [] } = useGetDatastoresQuery()

  const { ID, NAME, IM_MAD, VM_MAD, CLUSTER_ID, CLUSTER } = host
  const { name: stateName, color: stateColor } = getState(host)
  const {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel,
    maxCpu,
    maxMem,
    totalCpu,
    totalMem,
    colorCpu,
    colorMem,
    usageCpu,
    usageMem,
    reservedCpu,
    reservedMem,
  } = getAllocatedInfo(host)

  const handleRename = async (_, newName) => {
    await renameHost({ id: ID, name: newName })
  }

  const handleOvercommitmentCPU = async (name, value) => {
    let valueNumber = +value

    valueNumber === 0 && (valueNumber = usageCpu)
    const newTemplate = {
      RESERVED_CPU:
        value !== totalCpu ? totalCpu - valueNumber : reservedCpu ? 0 : '',
    }

    newTemplate &&
      (await updateHost({
        id: ID,
        template: jsonToXml(newTemplate),
        replace: 1,
      }))
  }

  const handleOvercommitmentMemory = async (name, value) => {
    let valueNumber = +value

    valueNumber === 0 && (valueNumber = usageMem)
    const newTemplate = {
      RESERVED_MEM:
        value !== totalMem ? totalMem - valueNumber : reservedMem ? 0 : '',
    }

    newTemplate &&
      (await updateHost({
        id: ID,
        template: jsonToXml(newTemplate),
        replace: 1,
      }))
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
    { name: T.IM_MAD, value: <StatusChip text={IM_MAD} />, dataCy: 'immad' },
    { name: T.VM_MAD, value: <StatusChip text={VM_MAD} />, dataCy: 'vmmad' },
  ]

  const capacity = [
    {
      name: T.AllocatedCpu,
      handleEdit: handleOvercommitmentCPU,
      canEdit: true,
      value: (
        <LinearProgressWithLabel
          value={percentCpuUsed}
          label={percentCpuLabel}
          high={HOST_THRESHOLD.CPU.high}
          low={HOST_THRESHOLD.CPU.low}
          color={colorCpu}
        />
      ),
      min: '0',
      max: `${totalCpu * 2}`,
      currentValue: maxCpu,
      title: T.Overcommitment,
    },
    {
      name: T.AllocatedMemory,
      handleEdit: handleOvercommitmentMemory,
      canEdit: true,
      value: (
        <LinearProgressWithLabel
          value={percentMemUsed}
          label={percentMemLabel}
          high={HOST_THRESHOLD.MEMORY.high}
          low={HOST_THRESHOLD.MEMORY.low}
          color={colorMem}
        />
      ),
      min: '0',
      max: `${totalMem * 2}`,
      currentValue: maxMem,
      unit: 'KB',
      unitParser: true,
      title: T.Overcommitment,
    },
  ]

  const infoFromDatastores = getDatastores(host).map((dsHost) => {
    const { percentOfUsed, percentLabel } = getCapacityInfo(dsHost)
    const dsName = datastores.find((ds) => +ds.ID === +dsHost.ID)?.NAME ?? '--'

    return {
      name: `#${dsHost.ID} ${dsName}`,
      dataCy: `ds-id-${dsHost.ID}`,
      value: (
        <LinearProgressWithLabel
          value={percentOfUsed}
          label={percentLabel}
          high={DS_THRESHOLD.CAPACITY.high}
          low={DS_THRESHOLD.CAPACITY.low}
        />
      ),
    }
  })

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ sx: { gridRow: 'span 2' } }}
      />
      <List title={T.Capacity} list={capacity} />
      {infoFromDatastores?.length > 0 && (
        <List title={T.Datastores} list={infoFromDatastores} />
      )}
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
