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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { getHostWilds } from '@ModelsModule'
import { HostAPI } from '@FeaturesModule'

import WildsTable from '@modules/components/Tables/Wilds'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Host id
 * @returns {ReactElement} - Wild information tab
 */
const WildsInfoTab = ({ id }) => {
  const { data: host = {} } = HostAPI.useGetHostQuery({ id })
  const wilds = getHostWilds(host)

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      <WildsTable wilds={wilds} />
    </Stack>
  )
}

WildsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

WildsInfoTab.displayName = 'WildsInfoTab'

export default WildsInfoTab
