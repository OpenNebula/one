/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { HostAPI } from '@FeaturesModule'
import EnhancedTable from '@modules/resources/Tables/Enhanced'
import WrapperRow from '@modules/resources/Tables/Enhanced/WrapperRow'
import PciColumns from '@modules/resources/Tables/Pcis/columns'
import PciRow from '@modules/resources/Tables/Pcis/row'
import { T } from '@ConstantsModule'
import { uniqWith } from 'lodash'

const DEFAULT_DATA_CY = 'pcis'

/**
 * @param {object} props - Props
 * @returns {ReactElement} PCIs table
 */
const PcisTable = (props) => {
  const { data: hosts = [] } = HostAPI.useGetHostsAdminQuery()
  const { rootProps = {}, searchProps = {}, hostId, ...rest } = props ?? {}

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const isNic = (device) => device?.CLASS?.startsWith('02')

  const data =
    props?.pcis ??
    []
      .concat(hosts)
      ?.filter((host) => !hostId || String(host?.ID) === String(hostId))
      ?.map((host) => [].concat(host?.HOST_SHARE?.PCI_DEVICES?.PCI))
      ?.flat()
      ?.filter((device) => !props?.filterOn || isNic(device))

  const filteredData = useMemo(() => {
    const [filterType, filterMode] = props?.filterOn ?? []
    if (!filterType) return [].concat(data)?.filter(Boolean)

    const filtered = []
      .concat(data)
      ?.filter(
        (d) =>
          (filterType === 'pf'
            ? (d?.SRIOV === 'pf' &&
                (d?.SRIOV_NUM === '0' ||
                  d?.SRIOV_NUM === 0 ||
                  !d?.SRIOV_NUM)) ||
              d?.SRIOV === 'no'
            : d?.SRIOV === filterType) &&
          (!d?.VMID || d?.VMID === '-1' || d?.VMID === -1)
      )

    return filterMode === 'automatic'
      ? (() => {
          const countMap =
            filterType === 'vf' || filterType === 'pf'
              ? filtered.reduce((acc, d) => {
                  const key = `${d?.DEVICE}:${d?.CLASS}:${d?.VENDOR}`
                  acc[key] = (acc[key] ?? 0) + 1

                  return acc
                }, {})
              : {}

          return uniqWith(
            filtered.map((d) => ({
              ...d,
              SHORT_ADDRESS: `${d?.BUS}:${d?.SLOT}.x`,
              AVAILABILITY:
                d?.SRIOV === 'vf'
                  ? String(countMap[`${d?.DEVICE}:${d?.CLASS}:${d?.VENDOR}`])
                  : String(
                      countMap[`${d?.DEVICE}:${d?.CLASS}:${d?.VENDOR}`] ?? 1
                    ),
            })),
            (a, b) =>
              a?.DEVICE === b?.DEVICE &&
              a?.CLASS === b?.CLASS &&
              a?.VENDOR === b?.VENDOR
          )
        })()
      : filtered
  }, [data, props?.filterOn])

  const listHeader = props?.customListHeader ?? [
    {
      header: T.VM,
      id: 'vm',
      accessor: ({ VMID }) => VMID && VMID !== -1 && VMID !== '-1' && VMID,
    },
    { header: T.IfName, accessor: 'IFNAME' },
    { header: T.Vendor, id: 'vendor', accessor: 'VENDOR' },
    { header: T.VendorName, id: 'vendorName', accessor: 'VENDOR_NAME' },
    { header: T.Class, id: 'class', accessor: 'CLASS' },
    { header: T.ClassName, id: 'className', accessor: 'CLASS_NAME' },
    { header: T.Device, id: 'device', accessor: 'DEVICE' },
    { header: T.DeviceName, id: 'deviceName', accessor: 'DEVICE_NAME' },
    { header: T.ShortAddress, id: 'shortAddress', accessor: 'SHORT_ADDRESS' },
  ]
  const { component, header } = WrapperRow(PciRow, false, props?.forceTableView)

  return (
    <EnhancedTable
      columns={PciColumns}
      data={filteredData}
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
