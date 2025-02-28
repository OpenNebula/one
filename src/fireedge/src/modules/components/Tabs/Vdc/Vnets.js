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
import PropTypes from 'prop-types'
import { ReactElement, useState } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { PATH } from '@modules/components/path'

import { VnsTable } from '@modules/components/Tables'
import SelectZones from '@modules/components/Tabs/Vdc/SelecZones'
import { VdcAPI, ZoneAPI } from '@FeaturesModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Datastore id
 * @returns {ReactElement} Information tab
 */
const VnetsInfoTab = ({ id }) => {
  const [selectedZone, setSelectedZone] = useState('0')
  const path = PATH.NETWORK.VNETS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const { data } = VdcAPI.useGetVDCQuery({ id })
  const { data: dataZones } = ZoneAPI.useGetZonesQuery()

  const vdcData = data.VNETS.VNET
    ? Array.isArray(data.VNETS.VNET)
      ? data.VNETS.VNET
      : [data.VNETS.VNET]
    : []

  const vdcVnetsIds = vdcData
    .filter((ds) => ds.ZONE_ID === selectedZone)
    .map((ds) => ds.VNET_ID)

  return (
    <>
      <SelectZones
        data={dataZones}
        handleZone={setSelectedZone}
        value={selectedZone}
      />
      <VnsTable.Table
        disableRowSelect
        disableGlobalSort
        vdcVnets={vdcVnetsIds}
        onRowClick={(row) => handleRowClick(row.ID)}
      />
    </>
  )
}

VnetsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VnetsInfoTab.displayName = 'VnetsInfoTab'

export default VnetsInfoTab
