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
import { Box, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { SkeletonLoading } from '@ComponentsModule'

/** @returns {ReactElement} Remote console VM information placeholder */
export const ConsoleHeaderSkeleton = () => (
  <Stack direction="row" alignItems="center" gap="0.75em" flexGrow={1}>
    <SkeletonLoading loading variant="rounded" width={38} height={38} />
    <Stack gap="0.35em" minWidth={0} flexGrow={1}>
      <SkeletonLoading loading height={30} width={{ xs: '100%', sm: '60%' }} />
      <SkeletonLoading loading height={16} width={{ xs: '80%', sm: '35%' }} />
    </Stack>
  </Stack>
)

/**
 * @param {object} props - Component props
 * @param {number[]} props.widths - Placeholder widths for the action groups
 * @returns {ReactElement} Remote console actions placeholder
 */
export const ConsoleActionsSkeleton = ({ widths = [74, 112, 36] }) => (
  <Stack direction="row" alignItems="center" gap="0.5em" flexWrap="wrap">
    {widths.map((width, index) => (
      <SkeletonLoading
        key={[width, index].join('-')}
        loading
        variant="rounded"
        width={width}
        height={34}
      />
    ))}
  </Stack>
)

ConsoleActionsSkeleton.propTypes = {
  widths: PropTypes.arrayOf(PropTypes.number),
}

/** @returns {ReactElement} Remote console display placeholder */
export const ConsoleDisplaySkeleton = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      minHeight: '16rem',
      display: 'flex',
    }}
  >
    <SkeletonLoading
      loading
      variant="rounded"
      width="100%"
      height="100%"
      borderRadius="xlg"
    />
  </Box>
)
