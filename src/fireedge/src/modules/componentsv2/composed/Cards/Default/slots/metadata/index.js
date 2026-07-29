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

import { forwardRef, Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/slots/metadata/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * MetadataSlot component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.label - Label text
 * @returns {Component} - MetadataSlot component
 */
export const MetadataSlot = forwardRef(({ labels = [] }, ref) => {
  const { translateText } = useTranslation()

  return (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      {labels?.map(([title, value], idx) => (
        <Box key={idx} className="region-label">
          {title && (
            <span className="region-label--title">
              {typeof title === 'string' ? translateText(title) : title}
            </span>
          )}
          {value && <span className="region-label--value">{value}</span>}
        </Box>
      ))}
    </Box>
  )
})

MetadataSlot.propTypes = {
  labels: PropTypes.array,
}

MetadataSlot.displayName = 'MetadataSlot'
