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
import {
  Box,
  LinearProgress,
  linearProgressClasses,
  Typography,
  useTheme,
} from '@mui/material'
import { css } from '@emotion/css'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { DatastoreAPI } from '@FeaturesModule'
import { Translate } from '@ComponentsModule'
import { T, COLOR, DATASTORE_TYPES } from '@ConstantsModule'
import { prettyBytes } from '@UtilsModule'

const styles = ({ palette, typography }) => ({
  root: css({
    padding: typography.pxToRem(24),
    borderRadius: typography.pxToRem(16),
    backgroundColor: palette.background.paper,
  }),
  title: css({
    marginBottom: typography.pxToRem(16),
    fontSize: typography.pxToRem(21),
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: typography.pxToRem(20),
  }),
  barLabel: css({
    fontSize: '1rem',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '1.25rem',
    paddingBottom: '0.5rem',
  }),
  progressBar: css({
    height: typography.pxToRem(8),
    borderRadius: typography.pxToRem(4),
    marginBottom: typography.pxToRem(16),
  }),
})

/**
 * Returns the appropriate color for a utilization percentage.
 *
 * @param {number} percentage - The utilization percentage (0-100)
 * @returns {string} Hex color string
 */
const getBarColor = (percentage) => {
  if (percentage >= 90) return COLOR.error.main
  if (percentage >= 70) return COLOR.warning.main

  return COLOR.success.main
}

/** Datastore type definitions for grouping and display. */
const DS_GROUPS = [
  {
    typeId: String(DATASTORE_TYPES.IMAGE.id),
    label: T.ImageDatastores,
  },
  {
    typeId: String(DATASTORE_TYPES.SYSTEM.id),
    label: T.SystemDatastores,
  },
  {
    typeId: String(DATASTORE_TYPES.FILE.id),
    label: T.FileDatastores,
  },
]

/**
 * Storage Capacity widget showing datastore usage grouped by type
 * (Image, System, File) with capacity bars.
 *
 * @param {object} props - Props
 * @param {string} props.view - Current view name
 * @returns {ReactElement|null} Storage capacity panel or null when no data
 */
const StorageCapacity = memo(({ view }) => {
  const theme = useTheme()
  const { palette } = theme
  const classes = useMemo(() => styles(theme), [theme])

  const { data: datastores = [] } = DatastoreAPI.useGetDatastoresQuery()

  const groups = useMemo(() => {
    if (!datastores?.length) return []

    return DS_GROUPS.map(({ typeId, label }) => {
      const filtered = datastores.filter((ds) => String(ds?.TYPE) === typeId)

      let totalMB = 0
      let usedMB = 0

      filtered.forEach((ds) => {
        totalMB += parseInt(ds?.TOTAL_MB || '0', 10)
        usedMB += parseInt(ds?.USED_MB || '0', 10)
      })

      const percent =
        totalMB > 0 ? Math.min((usedMB / totalMB) * 100, 100) : 0

      return { label, totalMB, usedMB, percent, count: filtered.length }
    }).filter(({ count }) => count > 0)
  }, [datastores])

  if (!datastores?.length || !groups.length) return null

  return (
    <Box className={classes.root} data-cy="dashboard-widget-storage-capacity">
      <Typography variant="h6" className={classes.title}>
        <Translate word={T.StorageCapacity} />
      </Typography>

      {groups.map(({ label, totalMB, usedMB, percent }) => (
        <Box key={label}>
          <Typography className={classes.barLabel}>
            <Translate word={label} />
            {`: ${prettyBytes(usedMB, 'MB', 1)} / ${prettyBytes(totalMB, 'MB', 1)}`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              [`&.${linearProgressClasses.colorPrimary}`]: {
                backgroundColor:
                  palette?.graphs?.cloud?.bars?.total || palette.action.hover,
              },
              [`& .${linearProgressClasses.bar}`]: {
                borderRadius: 4,
                backgroundColor: getBarColor(percent),
              },
            }}
            className={classes.progressBar}
          />
        </Box>
      ))}
    </Box>
  )
})

StorageCapacity.displayName = 'StorageCapacity'

StorageCapacity.propTypes = {
  view: PropTypes.string,
}

export { StorageCapacity }
export default StorageCapacity
