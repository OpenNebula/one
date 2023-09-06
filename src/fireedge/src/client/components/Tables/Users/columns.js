/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Enabled', accessor: 'ENABLED' },
  { Header: 'Auth driver', accessor: 'AUTH_DRIVER' },
  { Header: 'VM quota', accessor: 'VM_QUOTA' },
  { Header: 'Datastore quota', accessor: 'DATASTORE_QUOTA' },
  { Header: 'Network quota', accessor: 'NETWORK_QUOTA' },
  { Header: 'Image quota', accessor: 'IMAGE_QUOTA' },
]
