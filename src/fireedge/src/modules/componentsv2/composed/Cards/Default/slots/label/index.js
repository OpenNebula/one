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
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/slots/label/styles'
import { Tag } from '@modules/componentsv2/primitives/Tags'
import { TagList } from '@modules/componentsv2/primitives/Tags/List'

const getLabelTitleClassName = (className) =>
  ['tag-title', className].filter(Boolean).join(' ')

/**
 * LabelSlot component.
 *
 * @param {object} root0 - Params
 * @param {Array} root0.labels - Informational tags
 * @param {Array} root0.tags - Label tags
 * @param {number} root0.max - Maximum number of tags to display
 * @returns {Component} - LabelSlot component
 */
export const LabelSlot = forwardRef(({ labels = [], tags = [], max }, ref) => {
  const renderLabel = (label, idx) => {
    if (!Array.isArray(label)) {
      const tagOptions =
        label && typeof label === 'object' ? label : { title: String(label) }

      return (
        <Tag
          key={idx}
          {...tagOptions}
          titleClassName={getLabelTitleClassName(tagOptions.titleClassName)}
        />
      )
    }

    const [title, status = 'default', tagProps = {}] = label

    return (
      <Tag
        key={idx}
        title={title}
        status={status}
        {...tagProps}
        titleClassName={getLabelTitleClassName(tagProps.titleClassName)}
      />
    )
  }

  return (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      {labels?.map(renderLabel)}
      {tags.length > 0 && <TagList tags={tags} max={max} />}
    </Box>
  )
})

LabelSlot.propTypes = {
  labels: PropTypes.array,
  tags: PropTypes.array,
  max: PropTypes.number,
}

LabelSlot.displayName = 'LabelSlot'
