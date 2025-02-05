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
export default [
  {
    Header: 'VMID',
    /**
     * Function to return the value of the column.
     *
     * @param {object} props - PCI object
     * @param {string} props.VMID - Id of the virtual machine where the PCI device is attached
     * @returns {string} - Id of the virtual machine where the PCI device is attached
     */
    accessor: ({ VMID }) => VMID && VMID !== -1 && VMID !== '-1' && VMID,
  },
  { Header: 'VENDOR', accessor: 'VENDOR' },
  { Header: 'VENDOR_NAME', accessor: 'VENDOR_NAME' },
  { Header: 'CLASS', accessor: 'CLASS' },
  { Header: 'CLASS_NAME', accessor: 'CLASS_NAME' },
  { Header: 'DEVICE', accessor: 'DEVICE' },
  { Header: 'DEVICE_NAME', accessor: 'DEVICE_NAME' },
  { Header: 'SHORT_ADDRESS', accessor: 'SHORT_ADDRESS' },
  { Header: 'ADDRESS', accessor: 'ADDRESS' },
]
