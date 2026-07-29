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

import { ReactElement, memo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import { LogoAPI } from '@FeaturesModule'
import { OpenNebulaIcon } from '@modules/componentsv2/primitives/Icons'

const LOGO_DIMENSIONS = {
  collapsed: {
    width: 15.863,
    height: 19.966,
  },
  open: {
    width: 58.469,
    height: 19.957,
  },
}

/**
 * Displays the configured OpenNebula logo, falling back to the default icon.
 *
 * @param {object} root0 - Props
 * @param {boolean} root0.withText - Whether the fallback icon includes text
 * @param {number|string} root0.width - Logo width
 * @param {number|string} root0.height - Logo height
 * @param {string} root0.alt - Custom logo alt text
 * @param {object} root0.sx - Custom image styles
 * @returns {ReactElement} OpenNebula logo
 */
export const OpenNebulaLogo = memo(
  ({ withText = false, width, height, alt = 'Custom Logo', sx, ...props }) => {
    const dimensions = withText
      ? LOGO_DIMENSIONS.open
      : LOGO_DIMENSIONS.collapsed
    const resolvedWidth = width ?? dimensions.width
    const resolvedHeight = height ?? dimensions.height

    const [fetchCustomLogo, { data: encodedLogoData = {}, isUninitialized }] =
      LogoAPI.useLazyGetEncodedLogoQuery()

    useEffect(() => {
      if (isUninitialized) {
        fetchCustomLogo()
      }
    }, [fetchCustomLogo, isUninitialized])

    if (encodedLogoData?.b64) {
      return (
        <Box
          component="img"
          src={encodedLogoData.b64}
          alt={alt}
          sx={{
            backgroundColor: 'transparent',
            display: 'block',
            height: resolvedHeight,
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            width: resolvedWidth,
            ...sx,
          }}
          {...props}
        />
      )
    }

    return (
      <OpenNebulaIcon
        withText={withText}
        width={resolvedWidth}
        height={resolvedHeight}
      />
    )
  }
)

OpenNebulaLogo.propTypes = {
  withText: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  alt: PropTypes.string,
  sx: PropTypes.object,
}

OpenNebulaLogo.displayName = 'OpenNebulaLogo'
