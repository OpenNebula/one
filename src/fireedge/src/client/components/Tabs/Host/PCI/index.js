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
import PropTypes from 'prop-types'
import { ReactElement, useState, useCallback } from 'react'
import { MultiChart } from 'client/components/Charts'
import { useGetHostQuery } from 'client/features/OneApi/host'
import { transformApiResponseToDataset } from 'client/components/Charts/MultiChart/helpers/scripts'
import { Select, MenuItem, InputLabel, FormControl, Box } from '@mui/material'
import _ from 'lodash'

const keyMap = {
  ADDRESS: 'fullAddress',
  SHORT_ADDRESS: 'shortAddress',
  TYPE: 'type',
  DEVICE_NAME: 'deviceName',
  VENDOR_NAME: 'vendor',
  VMID: 'vmId',
}

const DataGridColumns = [
  { field: 'vmId', headerName: 'VM', flex: 1, type: 'number' },
  { field: 'shortAddress', headerName: 'Address', flex: 1 },
  { field: 'type', headerName: 'Type', flex: 1 },
  { field: 'deviceName', headerName: 'Name', flex: 1 },
  { field: 'vendor', headerName: 'Vendor', flex: 1, type: 'number' },
]

const metricKeys = ['vmId']

const metricNames = {
  shortAddress: 'PCI Address',
  type: 'Type',
  deviceName: 'Name',
  vmId: 'VMs',
}

const labelingFunc = () => `PCI`

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Host id
 * @returns {ReactElement} Information tab
 */
const HostPciTab = ({ id }) => {
  const [chartType, setChartType] = useState('table')
  const { data = [{}] } = useGetHostQuery({ id })

  const pciDevicesPath = 'HOST_SHARE.PCI_DEVICES.PCI'

  const transformedDataset = transformApiResponseToDataset(
    data,
    keyMap,
    metricKeys,
    labelingFunc,
    0,
    pciDevicesPath
  )

  const handleChartTypeChange = useCallback((event) => {
    const newChartType = event.target.value
    setChartType(newChartType)
  }, [])

  transformedDataset.dataset.data.forEach((dev, idx) => {
    if (+dev.vmId < 0) {
      _.set(transformedDataset.dataset.data, [idx, 'vmId'], '0')
    }
  })

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="flex-start"
        gap={2}
      >
        <FormControl
          variant="outlined"
          size="small"
          style={{ marginRight: 2, minWidth: 120 }}
        >
          <InputLabel>Chart Type</InputLabel>
          <Select
            value={chartType}
            onChange={handleChartTypeChange}
            label="Chart Type"
          >
            <MenuItem value="line">Line Chart</MenuItem>
            <MenuItem value="bar">Bar Chart</MenuItem>
            <MenuItem value="area">Area Chart</MenuItem>
            <MenuItem value="table">Table Chart</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: '100%',
        }}
      >
        <MultiChart
          datasets={[
            {
              ...transformedDataset.dataset,
              error: transformedDataset.error,
              isEmpty: transformedDataset.isEmpty,
            },
          ]}
          metricNames={metricNames}
          chartType={chartType}
          ItemsPerPage={10}
          tableColumns={DataGridColumns}
          groupBy={'deviceName'}
        />
      </Box>
    </>
  )
}

HostPciTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

HostPciTab.displayName = 'HostPciTab'

export default HostPciTab
