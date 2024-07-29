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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { useGetHostQuery } from 'client/features/OneApi/host'
import { getHostZombies } from 'client/models/Host'

import ZombiesTable from 'client/components/Tables/Zombies'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Host id
 * @returns {ReactElement} - Zombies information tab
 */
const ZombiesInfoTab = ({ id }) => {
  const { data: host = {} } = useGetHostQuery({ id })
  const zombies = getHostZombies(host)

  return (
    <Stack
      display="grid"
      gap="1em"
      gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
      padding={{ sm: '0.8em' }}
    >
      <ZombiesTable disableRowSelect disableGlobalSort zombies={zombies} />
    </Stack>
  )
}

ZombiesInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

ZombiesInfoTab.displayName = 'ZombiesInfoTab'

export default ZombiesInfoTab
