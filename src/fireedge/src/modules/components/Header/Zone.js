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

import { LinearProgress, MenuItem, Select } from '@mui/material'
import { Language as ZoneIcon } from 'iconoir-react'

import { Translate, TranslateProvider } from '@modules/components/HOC'
import HeaderPopover from '@modules/components/Header/Popover'
import { T } from '@ConstantsModule'
import { useGeneral, useGeneralApi, ZoneAPI } from '@FeaturesModule'

/**
 * Menu to select the OpenNebula Zone.
 *
 * @returns {ReactElement} Returns Zone list
 */
const Zone = () => {
  const { data: zones = [], isLoading } = ZoneAPI.useGetZonesQuery()
  const { zone } = useGeneral()
  const { changeZone } = useGeneralApi()

  return (
    <TranslateProvider>
      <HeaderPopover
        id="zone-menu"
        tooltip={T.Zone}
        icon={<ZoneIcon />}
        buttonProps={{
          'data-cy': 'header-zone-button',
          noborder: true,
        }}
        headerTitle={<Translate word={T.Zones} />}
      >
        {({ handleClose }) => (
          <>
            {isLoading && <LinearProgress />}
            {zones?.length ? (
              <Select
                inputProps={{ 'data-cy': 'select-zone' }}
                native
                onChange={(event) => {
                  changeZone(parseInt(event?.target?.value, 10))
                }}
                defaultValue={zone}
              >
                {zones?.map(({ ID, NAME }) => (
                  <option key={`zone-${ID}`} value={parseInt(ID, 10)}>
                    {NAME}
                  </option>
                ))}
              </Select>
            ) : (
              <MenuItem disabled>
                <Translate word={T.NotFound} />
              </MenuItem>
            )}
          </>
        )}
      </HeaderPopover>
    </TranslateProvider>
  )
}

Zone.displayName = 'ZoneHeaderComponent'

export default Zone
