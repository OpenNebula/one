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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { generatePath } from 'react-router-dom'
import { Stack } from '@mui/material'

import { VnAPI } from '@FeaturesModule'

import { StatusCircle, StatusChip } from '@modules/components/Status'
import { List } from '@modules/components/Tabs/Common'

import {
  levelLockToString,
  stringToBoolean,
  booleanToString,
  getVirtualNetworkState,
} from '@ModelsModule'
import {
  T,
  VNetwork,
  VN_ACTIONS,
  RESTRICTED_ATTRIBUTES_TYPE,
} from '@ConstantsModule'
import { PATH } from '@modules/components'
import { isRestrictedAttributes } from '@UtilsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {VNetwork} props.vnet - Virtual Network resource
 * @param {string[]} props.actions - Available actions to information tab
 * @param {object} props.oneConfig - Open Nebula configuration
 * @param {boolean} props.adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ vnet = {}, actions, oneConfig, adminGroup }) => {
  const [rename] = VnAPI.useRenameVNetMutation()
  const {
    ID,
    NAME,
    PARENT_NETWORK_ID: parentId,
    LOCK,
    VLAN_ID,
    VLAN_ID_AUTOMATIC,
    OUTER_VLAN_ID,
    OUTER_VLAN_ID_AUTOMATIC,
  } = vnet

  const { data: parent } = VnAPI.useGetVNetworkQuery(
    { id: parentId },
    { skip: !parentId }
  )

  const { name: stateName, color: stateColor } = getVirtualNetworkState(vnet)

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
      canEdit:
        actions?.includes?.(VN_ACTIONS.RENAME) &&
        (adminGroup ||
          !isRestrictedAttributes(
            'NAME',
            undefined,
            oneConfig[RESTRICTED_ATTRIBUTES_TYPE.VNET]
          )),
      handleEdit: handleRename,
    },
    parentId && {
      name: T.ReservationParent,
      value: `#${parentId} ${parent?.NAME ?? '--'}`,
      link:
        !Number.isNaN(+parentId) &&
        generatePath(PATH.NETWORK.VNETS.DETAIL, { id: parentId }),
      dataCy: 'parent',
    },
    {
      name: T.State,
      value: (
        <Stack direction="row" alignItems="center" gap={1}>
          <StatusCircle color={stateColor} />
          <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
        </Stack>
      ),
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
    {
      name: T.VlanId,
      value: VLAN_ID || '-',
      dataCy: 'vlan-id',
    },
    {
      name: T.AutomaticVlanId,
      value: booleanToString(stringToBoolean(VLAN_ID_AUTOMATIC)),
      dataCy: 'vlan-id-automatic',
    },
    {
      name: T.OuterVlanId,
      value: OUTER_VLAN_ID || '-',
      dataCy: 'outer-vlan-id',
    },
    {
      name: T.AutomaticOuterVlanId,
      value: booleanToString(stringToBoolean(OUTER_VLAN_ID_AUTOMATIC)),
      dataCy: 'outer-vlan-id-automatic',
    },
  ].filter(Boolean)

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ sx: { gridRow: 'span 2' } }}
      />
    </>
  )
}

InformationPanel.propTypes = {
  vnet: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
