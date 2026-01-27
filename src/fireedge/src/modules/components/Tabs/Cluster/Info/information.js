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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { ClusterAPI, ProvisionAPI } from '@FeaturesModule'
import { List } from '@modules/components/Tabs/Common'
import { StatusChip, StatusCircle } from '@modules/components/Status'
import { T, Cluster, CLUSTER_ACTIONS } from '@ConstantsModule'
import { getProvisionColorState, jsonToXml } from '@ModelsModule'
import { Stack } from '@mui/material'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Cluster} props.cluster - Cluster resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ cluster = {}, actions }) => {
  const [renameCluster] = ClusterAPI.useRenameClusterMutation()
  const [updateCluster] = ClusterAPI.useUpdateClusterMutation()
  const { ID, NAME, TEMPLATE } = cluster
  const { RESERVED_MEM, RESERVED_CPU } = TEMPLATE

  const handleRename = async (_, newName) => {
    await renameCluster({ id: ID, name: newName })
  }

  // Info section
  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(CLUSTER_ACTIONS.RENAME),
      handleEdit: handleRename,
      dataCy: 'name',
    },
  ]

  // Show only Provision status if the cluster was created by OneForm
  if (cluster?.TEMPLATE?.ONEFORM) {
    const { data: provision } = ProvisionAPI.useGetProvisionQuery({
      id: cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID,
    })
    const provisionState = provision?.TEMPLATE?.PROVISION_BODY?.state
    const stateColor = getProvisionColorState(provisionState)
    info.push({
      name: T.State,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          <StatusCircle color={stateColor} />
          <StatusChip
            dataCy="state"
            text={provisionState}
            stateColor={stateColor}
          />
        </Stack>
      ),
    })
  }

  /**
   * Update reserved CPU on the template cluster.
   *
   * @param {string} name - Name of the attribute
   * @param {number} value - Value of the attribute
   */
  const handleOvercommitmentCPU = async (name, value) => {
    const newTemplate = {
      RESERVED_CPU: value + '%',
    }

    await updateCluster({
      id: ID,
      template: jsonToXml(newTemplate),
      replace: 1,
    })
  }

  /**
   * Update reserved memory on the template cluster.
   *
   * @param {string} name - Name of the attribute
   * @param {number} value - Value of the attribute
   */
  const handleOvercommitmentMemory = async (name, value) => {
    const newTemplate = {
      RESERVED_MEM: value + '%',
    }

    await updateCluster({
      id: ID,
      template: jsonToXml(newTemplate),
      replace: 1,
    })
  }

  // Overcommitment section
  const overcommitment = [
    {
      name: T.ReservedCpu,
      handleEdit: handleOvercommitmentCPU,
      canEdit: true,
      value: <span>{RESERVED_CPU}</span>,
      min: '-100',
      max: '100',
      currentValue: RESERVED_CPU?.replace(/%/g, ''),
      dataCy: 'allocated-cpu',
    },
    {
      name: T.ReservedMemory,
      handleEdit: handleOvercommitmentMemory,
      canEdit: true,
      value: <span>{RESERVED_MEM}</span>,
      min: '-100',
      max: '100',
      currentValue: RESERVED_MEM?.replace(/%/g, ''),
      dataCy: 'allocated-memory',
    },
  ]

  return (
    <>
      <List title={T.Information} list={info} />
      <List title={T.Overcommitment} list={overcommitment} />
    </>
  )
}

InformationPanel.propTypes = {
  cluster: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
