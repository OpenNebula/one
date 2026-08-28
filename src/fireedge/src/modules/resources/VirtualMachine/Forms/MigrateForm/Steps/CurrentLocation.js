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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { InfoEmpty } from 'iconoir-react'

import { DatastoreAPI } from '@FeaturesModule'
import { getLastHistory } from '@ModelsModule'
import { Translate } from '@ProvidersModule'
import { T } from '@ConstantsModule'

const CurrentLocation = ({ vm }) => {
  const vms = [vm].flat().filter(Boolean)
  const { data: datastores = [] } = DatastoreAPI.useGetDatastoresQuery()

  const locations = vms
    .map((vmData) => {
      const { ID, NAME } = vmData
      const { HID, HOSTNAME, DS_ID } = getLastHistory(vmData)
      const hasLocation = [HID, HOSTNAME, DS_ID].some(
        (value) => value !== undefined && value !== null && value !== ''
      )

      if (!hasLocation) return undefined

      const datastoreName =
        datastores.find(({ ID: datastoreId }) =>
          [datastoreId, DS_ID].every(
            (value) => value !== undefined && value !== null
          )
            ? String(datastoreId) === String(DS_ID)
            : false
        )?.NAME ?? '--'

      return {
        vm: `${ID ?? '--'} ${NAME ?? '--'}`,
        host: `${HID ?? '--'} ${HOSTNAME ?? '--'}`,
        datastore: `${DS_ID ?? '--'} ${datastoreName}`,
      }
    })
    .filter(Boolean)

  if (!locations.length) return null

  return (
    <Box
      role="status"
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'flex-start',
        gap: `${theme.scale[200]}px`,
        width: '100%',
        maxWidth: 'none',
        boxSizing: 'border-box',
        padding: `${theme.scale[400]}px`,
        mb: 2,
        bgcolor: 'surface.information',
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.information}`,
        borderRadius: `${theme.borderRadius.lg}px`,
        color: 'text.information',
      })}
    >
      <Box
        component={InfoEmpty}
        width={20}
        height={20}
        flexShrink={0}
        color="icon.information"
      />
      <Box>
        {locations.map((location) => (
          <Typography key={location.vm} variant="body2" color="inherit">
            <Translate
              word={T.WhereIsRunning}
              values={[location.vm, location.host, location.datastore]}
            />
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

CurrentLocation.propTypes = {
  vm: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
}

export default CurrentLocation
