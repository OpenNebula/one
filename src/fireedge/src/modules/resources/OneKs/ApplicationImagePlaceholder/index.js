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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import { getStyles } from '@modules/resources/OneKs/ApplicationImagePlaceholder/styles'

/**
 * Theme-aware placeholder for application images.
 *
 * @param {object} root0 - Props
 * @param {number|string} root0.width - Placeholder width
 * @param {number|string} root0.height - Placeholder height
 * @param {object|Array|Function} root0.sx - Custom styles
 * @param {object} ref - Forwarded ref
 * @returns {Component} Application image placeholder
 */
export const ApplicationImagePlaceholder = forwardRef(
  ({ width = '100%', height = '100%', sx, ...props }, ref) => (
    <Box
      ref={ref}
      aria-hidden
      component="svg"
      viewBox="0 0 32 32"
      width={width}
      height={height}
      fill="none"
      sx={[
        (theme) => getStyles({ theme }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ].filter(Boolean)}
      {...props}
    >
      <path
        className="application-placeholder-background"
        d="M22 2.75H10C5.99594 2.75 2.75 5.99594 2.75 10V22C2.75 26.0041 5.99594 29.25 10 29.25H22C26.0041 29.25 29.25 26.0041 29.25 22V10C29.25 5.99594 26.0041 2.75 22 2.75Z"
      />
      <path
        className="application-placeholder-outline"
        d="M22 3.5H10C6.41015 3.5 3.5 6.41015 3.5 10V22C3.5 25.5899 6.41015 28.5 10 28.5H22C25.5899 28.5 28.5 25.5899 28.5 22V10C28.5 6.41015 25.5899 3.5 22 3.5Z"
      />
      <path
        className="application-placeholder-connector"
        d="M13 11.5H19M11.5 13V19M20.5 13V19M13 20.5H19"
        strokeOpacity={0.44}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        className="application-placeholder-tile"
        d="M12 8.5H10C9.17157 8.5 8.5 9.17157 8.5 10V12C8.5 12.8284 9.17157 13.5 10 13.5H12C12.8284 13.5 13.5 12.8284 13.5 12V10C13.5 9.17157 12.8284 8.5 12 8.5Z"
      />
      <path
        className="application-placeholder-tile"
        d="M22 8.5H20C19.1716 8.5 18.5 9.17157 18.5 10V12C18.5 12.8284 19.1716 13.5 20 13.5H22C22.8284 13.5 23.5 12.8284 23.5 12V10C23.5 9.17157 22.8284 8.5 22 8.5Z"
        fillOpacity={0.72}
      />
      <path
        className="application-placeholder-tile"
        d="M12 18.5H10C9.17157 18.5 8.5 19.1716 8.5 20V22C8.5 22.8284 9.17157 23.5 10 23.5H12C12.8284 23.5 13.5 22.8284 13.5 22V20C13.5 19.1716 12.8284 18.5 12 18.5Z"
        fillOpacity={0.72}
      />
      <path
        className="application-placeholder-tile"
        d="M22 18.5H20C19.1716 18.5 18.5 19.1716 18.5 20V22C18.5 22.8284 19.1716 23.5 20 23.5H22C22.8284 23.5 23.5 22.8284 23.5 22V20C23.5 19.1716 22.8284 18.5 22 18.5Z"
        fillOpacity={0.42}
      />
    </Box>
  )
)

ApplicationImagePlaceholder.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
}

ApplicationImagePlaceholder.displayName = 'ApplicationImagePlaceholder'
