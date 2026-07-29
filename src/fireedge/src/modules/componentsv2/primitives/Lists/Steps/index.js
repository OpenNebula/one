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

import {
  Children,
  Component,
  createElement,
  forwardRef,
  isValidElement,
  useMemo,
} from 'react'
import PropTypes from 'prop-types'
import { Box, List as MUIList, ListItem as MUIListItem } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Lists/Steps/styles'
import { v4 as uuidv4 } from 'uuid'

/**
 * StepList component.
 *
 * @param {object} root0 - Params
 * @param {Array} root0.items - Step item content
 * @param {object} root0.children - Step item children
 * @param {number} root0.start - First marker number
 * @returns {Component} - StepList component
 */
export const StepList = forwardRef(
  ({ children, items = [], start = 1, ...opts }, ref) => {
    const listId = useMemo(() => uuidv4(), [])
    const steps = useMemo(
      () => (items.length ? items : Children.toArray(children)),
      [children, items]
    )

    const renderElement = (element) =>
      isValidElement(element)
        ? element
        : typeof element === 'function'
        ? createElement(element)
        : element

    return (
      <Box sx={(theme) => getStyles({ theme })}>
        <MUIList
          className="steplist-container"
          component="ol"
          ref={ref}
          {...opts}
        >
          {steps.map((step, index) => (
            <MUIListItem
              className="steplist-item"
              component="li"
              disablePadding
              key={`${listId}-step-${index}`}
            >
              <Box className="item-marker">{start + index}</Box>
              <Box className="item-content">{renderElement(step)}</Box>
            </MUIListItem>
          ))}
        </MUIList>
      </Box>
    )
  }
)

StepList.propTypes = {
  children: PropTypes.node,
  items: PropTypes.arrayOf(PropTypes.node),
  start: PropTypes.number,
}

StepList.displayName = 'StepList'
