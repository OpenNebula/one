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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import Information from '@modules/components/Tabs/Driver/Info/information'
import { DriverAPI } from '@FeaturesModule'
const { useGetDriverQuery } = DriverAPI

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Driver name
 * @returns {ReactElement} Information tab
 */
const DriverInfoTab = ({ tabProps = {}, id: name }) => {
  const { information_panel: informationPanel } = tabProps

  const { data: driver = {} } = useGetDriverQuery({ name: name?.toLowerCase() })

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(500px, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      {informationPanel?.enabled && <Information driver={driver} />}
    </Stack>
  )
}

DriverInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

DriverInfoTab.displayName = 'DriverInfoTab'

export default DriverInfoTab
