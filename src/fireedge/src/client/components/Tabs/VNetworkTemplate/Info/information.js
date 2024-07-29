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
import { List } from 'client/components/Tabs/Common'
import { T, VN_TEMPLATE_ACTIONS, VNetworkTemplate } from 'client/constants'
import { useRenameVNTemplateMutation } from 'client/features/OneApi/networkTemplate'
import {
  booleanToString,
  levelLockToString,
  stringToBoolean,
} from 'client/models/Helper'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {VNetworkTemplate} props.vnetTemplate - Virtual network template resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ vnetTemplate = {}, actions }) => {
  const [rename] = useRenameVNTemplateMutation()
  const { ID, NAME, VLAN_ID_AUTOMATIC, OUTER_VLAN_ID_AUTOMATIC, LOCK } =
    vnetTemplate

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
      canEdit: actions?.includes?.(VN_TEMPLATE_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
    {
      name: T.AutomaticVlanId,
      value: booleanToString(stringToBoolean(VLAN_ID_AUTOMATIC)),
      dataCy: 'vlan_id_automatic',
      handleEdit: handleRename,
    },
    {
      name: T.OuterVlanId,
      value: OUTER_VLAN_ID_AUTOMATIC || '-',
      dataCy: 'outer_vlan_id_automatic',
    },
    {
      name: T.AutomaticOuterVlanId,
      value: booleanToString(stringToBoolean(OUTER_VLAN_ID_AUTOMATIC)),
      dataCy: 'outer_vlan_automatic',
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
  ]

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.propTypes = {
  vnetTemplate: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
