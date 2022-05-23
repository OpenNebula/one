/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
const getTotalOfResources = (resources) =>
  [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'Updated VMs',
    id: 'UPDATED_VMS',
    accessor: (row) => getTotalOfResources(row?.UPDATED_VMS),
    sortType: 'number',
  },
  {
    Header: 'Outdated VMs',
    id: 'OUTDATED_VMS',
    accessor: (row) => getTotalOfResources(row?.OUTDATED_VMS),
    sortType: 'number',
  },
  {
    Header: 'Updating VMs',
    id: 'UPDATING_VMS',
    accessor: (row) => getTotalOfResources(row?.UPDATING_VMS),
    sortType: 'number',
  },
  {
    Header: 'Error VMs',
    id: 'ERROR_VMS',
    accessor: (row) => getTotalOfResources(row?.ERROR_VMS),
    sortType: 'number',
  },
]
