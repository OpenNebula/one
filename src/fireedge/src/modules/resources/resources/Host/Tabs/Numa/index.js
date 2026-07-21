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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import EmptyTab from '@modules/resources/Tabs/EmptyTab'
import { InformationPanel } from '@modules/resources/resources/Host/Tabs/Numa/Information'

import { getHostNuma } from '@ModelsModule'

import { UpdateNumaForm } from '@modules/resources/resources/Host/Tabs/Numa/UpdateNuma'
import { T } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Host API data
 * @returns {Component} Host numa tab
 */
export const HostNumaTab = ({ data }) => {
  const { host } = data

  const numa = getHostNuma(host)

  return (
    <Box>
      <UpdateNumaForm host={host} />
      {numa?.length > 0 ? (
        numa.map((node) => (
          <InformationPanel key={node.NODE_ID} node={node} host={host} />
        ))
      ) : (
        <EmptyTab />
      )}
    </Box>
  )
}

HostNumaTab.propTypes = {
  data: PropTypes.object,
  tabProps: PropTypes.object,
  host: PropTypes.object,
  id: PropTypes.string,
}

HostNumaTab.displayName = 'HostNumaTab'
HostNumaTab.label = T.Numa
HostNumaTab.id = 'numa'
HostNumaTab.title = T.Numa
