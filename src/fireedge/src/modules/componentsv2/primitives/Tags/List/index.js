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
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { Tag } from '@modules/componentsv2/primitives/Tags/Default'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip'
import {
  getStyles,
  getPopupStyles,
} from '@modules/componentsv2/primitives/Tags/List/styles'

/**
 * @param {object} root0 - Params
 * @param {object[]} root0.tags - List of Tag prop objects to display
 * @param {number} root0.max - Maximum number of tags to show
 * @param {boolean} root0.wrap - Allow tags to wrap across multiple lines
 * @returns {Component} - Displays a capped list of tags with overflow tooltip
 */
export const TagList = ({ tags = [], max = 2, wrap = false }) => {
  const visible = tags.slice(0, max)
  const hidden = tags.slice(max)

  const renderTag = ({ title, titleClassName, ...tagProps }) => (
    <Tag
      key={title}
      title={title}
      titleClassName={['tag-title', titleClassName].filter(Boolean).join(' ')}
      isInteractive={false}
      {...tagProps}
    />
  )

  return (
    <Box sx={(theme) => getStyles({ theme, wrap })}>
      {visible.map(renderTag)}
      {hidden.length > 0 && (
        <Tooltip
          title={<Box sx={getPopupStyles()}>{hidden.map(renderTag)}</Box>}
        >
          <Box sx={{ display: 'inline-flex' }}>
            <Tag title={`+${hidden.length}`} />
          </Box>
        </Tooltip>
      )}
    </Box>
  )
}

TagList.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      status: PropTypes.string,
      isInteractive: PropTypes.bool,
      startIcon: PropTypes.node,
      endIcon: PropTypes.node,
      endIconSize: PropTypes.number,
      isSelected: PropTypes.bool,
      titleClassName: PropTypes.string,
      customColor: PropTypes.shape({
        background: PropTypes.string,
        border: PropTypes.string,
        text: PropTypes.string,
      }),
    })
  ),
  max: PropTypes.number,
  wrap: PropTypes.bool,
}

TagList.displayName = 'TagList'
