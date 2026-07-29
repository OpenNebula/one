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
import { getStyles } from '@modules/componentsv2/composed/Cards/Details/styles'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import { useClipboard } from '@HooksModule'
import { T } from '@ConstantsModule'

const getOptionDataCy = (label, dataCy) => {
  const optionDataCy = dataCy ?? label

  return ['string', 'number'].includes(typeof optionDataCy)
    ? String(optionDataCy).toLowerCase()
    : undefined
}

/**
 * DetailsCard component.
 *
 * @param {object} root0 - Params
 * @returns {Component} - DetailsCard component
 */
export const DetailsCard = forwardRef(({ title, options = [] }, ref) => {
  const { copy, isCopied } = useClipboard()
  const isValueCopyable = (value) =>
    ['string', 'number']?.includes(typeof value) && value !== '-'

  return (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      {title && <Box className="details-title">{title}</Box>}

      <Box className="details-container">
        {[]
          .concat(options)
          ?.filter(Boolean)
          ?.map(([label, value, dataCy], idx) => (
            <Box key={idx} className="card-detail--row">
              <Box className="card-detail--label">{label}</Box>
              <Tooltip
                title={
                  isValueCopyable(value)
                    ? isCopied(value)
                      ? T.Copied
                      : value
                    : ''
                }
                placement="bottom-start"
              >
                <Box
                  className="card-detail--value"
                  data-cy={getOptionDataCy(label, dataCy)}
                  onClick={() => {
                    if (!isValueCopyable(value)) return
                    copy(value)
                  }}
                >
                  {value}
                </Box>
              </Tooltip>
            </Box>
          ))}
      </Box>
    </Box>
  )
})

DetailsCard.propTypes = {
  title: PropTypes.string,
  options: PropTypes.array,
}

DetailsCard.displayName = 'DetailsCard'
