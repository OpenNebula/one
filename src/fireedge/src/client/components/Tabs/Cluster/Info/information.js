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

import { useRenameClusterMutation } from 'client/features/OneApi/cluster'
import { List } from 'client/components/Tabs/Common'
import { T, Cluster, CLUSTER_ACTIONS } from 'client/constants'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Cluster} props.cluster - Cluster resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ cluster = {}, actions }) => {
  const [renameCluster] = useRenameClusterMutation()
  const { ID, NAME, TEMPLATE } = cluster
  const { RESERVED_MEM, RESERVED_CPU } = TEMPLATE

  const handleRename = async (_, newName) => {
    await renameCluster({ id: ID, name: newName })
  }

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

  const overcommitment = [
    { name: T.ReservedMemory, value: RESERVED_MEM },
    { name: T.ReservedCpu, value: RESERVED_CPU },
  ]

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ style: { gridRow: 'span 3' } }}
      />
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
