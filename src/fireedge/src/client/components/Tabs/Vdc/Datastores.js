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
import { ReactElement, useState } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { PATH } from 'client/apps/sunstone/routesOne'

import { DatastoresTable } from 'client/components/Tables'
import SelectZones from 'client/components/Tabs/Vdc/SelecZones'
import { useGetVDCQuery } from 'client/features/OneApi/vdc'
import { useGetZonesQuery } from 'client/features/OneApi/zone'
import PropTypes from 'prop-types'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Datastore id
 * @returns {ReactElement} Information tab
 */
const DatastoresInfoTab = ({ id }) => {
  const [selectedZone, setSelectedZone] = useState('0')

  const path = PATH.STORAGE.DATASTORES.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const { data } = useGetVDCQuery({ id })
  const { data: dataZones } = useGetZonesQuery()

  const vdcData = data.DATASTORES.DATASTORE
    ? Array.isArray(data.DATASTORES.DATASTORE)
      ? data.DATASTORES.DATASTORE
      : [data.DATASTORES.DATASTORE]
    : []

  const vdcDatastoresIds = vdcData
    .filter((ds) => ds.ZONE_ID === selectedZone)
    .map((ds) => ds.DATASTORE_ID)

  return (
    <>
      <SelectZones
        data={dataZones}
        handleZone={setSelectedZone}
        value={selectedZone}
      />
      <DatastoresTable
        disableRowSelect
        disableGlobalSort
        vdcDatastores={vdcDatastoresIds}
        onRowClick={(row) => handleRowClick(row.ID)}
      />
    </>
  )
}

DatastoresInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

DatastoresInfoTab.displayName = 'DatastoresInfoTab'

export default DatastoresInfoTab
