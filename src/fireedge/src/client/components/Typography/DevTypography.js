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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Typography, Chip, Box } from '@mui/material'

const DevTypography = memo(
  ({ labelProps = {}, color = 'secondary', chipProps = {}, children = '' }) => (
    <Box component="span" display="inline-flex" gap="1em" width="100%">
      <Typography
        flexGrow={1}
        variant="inherit"
        sx={{ textTransform: 'capitalize' }}
        {...labelProps}
      >
        {children}
      </Typography>
      <Chip
        size="small"
        label="DEV"
        color={color}
        sx={{
          height: 'auto',
          cursor: 'inherit',
        }}
        {...chipProps}
      />
    </Box>
  )
)

DevTypography.propTypes = {
  chipProps: PropTypes.object,
  color: PropTypes.string,
  labelProps: PropTypes.object,
  children: PropTypes.any,
}

DevTypography.displayName = 'DevTypography'

export default DevTypography
