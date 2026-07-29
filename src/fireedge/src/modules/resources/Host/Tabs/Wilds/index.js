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
import PropTypes from 'prop-types'
import { Component } from 'react'
import { Table } from '@ComponentsV2Module'
import { getHostWilds } from '@ModelsModule'
import { T } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Host API data
 * @returns {Component} Host wild tab
 */
export const HostWildsTab = ({ data }) => {
  const { host } = data
  const wildsData = getHostWilds(host)

  const columns = [
    {
      header: T.Name,
      id: 'name',
      accessorKey: 'VM_NAME',
      truncate: true,
    },
  ]

  return <Table columns={columns} data={wildsData} isRowsSelectable={false} />
}

HostWildsTab.propTypes = {
  data: PropTypes.object,
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

HostWildsTab.displayName = 'HostWildsTab'
HostWildsTab.id = 'wild'
HostWildsTab.title = T.Wilds
