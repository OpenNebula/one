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
import { ReactElement, useMemo } from 'react'

import EnhancedTable from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import PciColumns from '@modules/components/Tables/Pcis/columns'
import PciRow from '@modules/components/Tables/Pcis/row'
import { T } from '@ConstantsModule'

const DEFAULT_DATA_CY = 'pcis'

/**
 * @param {object} props - Props
 * @returns {ReactElement} PCIs table
 */
const PcisTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const data = props?.pcis

  const listHeader = [
    {
      header: T.VM,
      id: 'vm',
      accessor: ({ VMID }) => VMID && VMID !== -1 && VMID !== '-1' && VMID,
    },
    { header: T.Vendor, id: 'vendor', accessor: 'VENDOR' },
    { header: T.VendorName, id: 'vendorName', accessor: 'VENDOR_NAME' },
    { header: T.Class, id: 'class', accessor: 'CLASS' },
    { header: T.ClassName, id: 'className', accessor: 'CLASS_NAME' },
    { header: T.Device, id: 'device', accessor: 'DEVICE' },
    { header: T.DeviceName, id: 'deviceName', accessor: 'DEVICE_NAME' },
    { header: T.ShortAddress, id: 'shortAddress', accessor: 'SHORT_ADDRESS' },
  ]
  const { component, header } = WrapperRow(PciRow)

  return (
    <EnhancedTable
      columns={PciColumns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      getRowId={(row) => String(row.ADDRESS)}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

PcisTable.propTypes = { ...EnhancedTable.propTypes }
PcisTable.displayName = 'PcisTable'

export default PcisTable
