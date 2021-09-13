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

import { List } from 'client/components/Tabs/Common'

import { T, CLUSTER_ACTIONS } from 'client/constants'

const InformationPanel = ({ cluster = {}, handleRename, actions }) => {
  const { ID, NAME, TEMPLATE } = cluster
  const { RESERVED_MEM, RESERVED_CPU } = TEMPLATE

  const info = [
    { name: T.ID, value: ID },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(CLUSTER_ACTIONS.RENAME),
      handleEdit: handleRename
    }
  ]

  const overcommitment = [
    { name: T.ReservedMemory, value: RESERVED_MEM },
    { name: T.ReservedCpu, value: RESERVED_CPU }
  ]

  return (
    <>
      <List title={T.Information} list={info} />
      <List title={T.Overcommitment} list={overcommitment} />
    </>
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  cluster: PropTypes.object
}

export default InformationPanel
