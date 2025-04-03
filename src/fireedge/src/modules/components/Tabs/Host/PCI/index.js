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
import { ReactElement } from 'react'
import { HostAPI } from '@FeaturesModule'
import { Stack } from '@mui/material'
import { PcisTable } from '@modules/components/Tables'
import { getHostPcis } from '@ModelsModule'
import { T } from '@ConstantsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Host id
 * @returns {ReactElement} Information tab
 */
const HostPciTab = ({ id }) => {
  const { data: host = {} } = HostAPI.useGetHostQuery({ id })
  const pcis = getHostPcis(host)

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      <PcisTable.Table disableRowSelect disableGlobalSort pcis={pcis} />
    </Stack>
  )
}

HostPciTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

HostPciTab.displayName = 'HostPciTab'
HostPciTab.label = T.Pci

export default HostPciTab
