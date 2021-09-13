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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { StatusChip, LinearProgressWithLabel } from 'client/components/Status'
import { List } from 'client/components/Tabs/Common'

import * as Host from 'client/models/Host'
import * as Datastore from 'client/models/Datastore'
import { T, VM_ACTIONS } from 'client/constants'

const InformationPanel = ({ host = {}, handleRename, actions }) => {
  const { ID, NAME, IM_MAD, VM_MAD, CLUSTER_ID, CLUSTER } = host
  const { name: stateName, color: stateColor } = Host.getState(host)
  const datastores = Host.getDatastores(host)
  const {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel
  } = Host.getAllocatedInfo(host)

  const info = [
    { name: T.ID, value: ID },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(VM_ACTIONS.RENAME),
      handleEdit: handleRename
    },
    {
      name: T.State,
      value: <StatusChip text={stateName} stateColor={stateColor} />
    },
    { name: T.Cluster, value: `#${CLUSTER_ID} ${CLUSTER}` },
    { name: T.IM_MAD, value: IM_MAD },
    { name: T.VM_MAD, value: VM_MAD }
  ]

  const capacity = [{
    name: T.AllocatedMemory,
    value: <LinearProgressWithLabel value={percentMemUsed} label={percentMemLabel} />
  }, {
    name: T.AllocatedCpu,
    value: <LinearProgressWithLabel value={percentCpuUsed} label={percentCpuLabel} />
  }]

  const datastore = datastores.map(ds => {
    const { percentOfUsed, percentLabel } = Datastore.getCapacityInfo(ds)

    return {
      name: `#${ds?.ID}`, // TODO: add datastore name
      value: <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
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
      <List title={T.Datastores} list={datastore} />
    </>
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  host: PropTypes.object
}

export default InformationPanel
