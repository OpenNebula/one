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

import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Images/Default/styles'

export const Image = forwardRef(
  ({ src, width, height, alt, aspectRatio, ...opts }, ref) => (
    <Box
      ref={ref}
      sx={(theme) => getStyles({ theme, aspectRatio })}
      className={'image-container'}
    >
      <img
        src={src}
        width={width}
        height={height}
        alt={alt}
        className={'avatar-image'}
      />
    </Box>
  )
)

Image.propTypes = {
  src: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  alt: PropTypes.string,
  aspectRatio: PropTypes.string,
}

Image.displayName = 'Image'
