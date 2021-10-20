/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, JSXElementConstructor } from 'react'

import { MenuList, MenuItem, LinearProgress } from '@mui/material'
import { Language as ZoneIcon } from 'iconoir-react'

import { useFetch } from 'client/hooks'
import { useZone, useZoneApi } from 'client/features/One'
import HeaderPopover from 'client/components/Header/Popover'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Menu to select the OpenNebula Zone.
 *
 * @returns {JSXElementConstructor} Returns Zone list
 */
const Zone = () => {
  const zones = useZone()
  const { getZones } = useZoneApi()
  const { fetchRequest, loading } = useFetch(getZones)

  return (
    <HeaderPopover
      id='zone-menu'
      tooltip={T.Zone}
      icon={<ZoneIcon />}
      buttonProps={{ 'data-cy': 'header-zone-button' }}
      headerTitle={<Translate word={T.Zones} />}
    >
      {({ handleClose }) => {
        useEffect(() => {
          fetchRequest()
        }, [])

        return (
          <>
            {loading && <LinearProgress color='secondary' />}
            <MenuList>
              {zones?.length
                ? zones?.map(({ ID, NAME }) => (
                  <MenuItem key={`zone-${ID}`} onClick={handleClose}>
                    {NAME}
                  </MenuItem>
                ))
                : (
                  <MenuItem disabled>
                    <Translate word={T.NotFound} />
                  </MenuItem>
                )
              }
            </MenuList>
          </>
        )
      }}
    </HeaderPopover>
  )
}

Zone.displayName = 'ZoneHeaderComponent'

export default Zone
