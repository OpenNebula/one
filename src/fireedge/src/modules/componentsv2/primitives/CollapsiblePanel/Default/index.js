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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material'
import { Component, ReactNode, forwardRef, isValidElement } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { NavArrowDown as ExpandIcon } from 'iconoir-react'
import { Tag } from '@modules/componentsv2/primitives/Tags'
import { getStyles } from '@modules/componentsv2/primitives/CollapsiblePanel/Default/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * Collapsible panel with arbitrary content.
 *
 * @param {object} props - Component properties
 * @param {ReactNode} props.title - Panel title
 * @param {ReactNode} props.tag - Tag rendered before expand icon
 * @param {boolean} props.isDefaultCollapsed - Initial collapsed state
 * @param {ReactNode} props.children - Panel content
 * @returns {Component} Collapsible panel
 */
export const CollapsiblePanel = forwardRef(
  (
    {
      children,
      className,
      isDefaultCollapsed = true,
      keepMounted = true,
      tag,
      title,
      contentProps = {},
      summaryProps = {},
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const hasTag =
      isValidElement(tag) || typeof tag === 'string' || typeof tag === 'number'

    return (
      <Accordion
        className={clsx('collapsible-panel', className)}
        disableGutters
        defaultExpanded={!isDefaultCollapsed}
        TransitionProps={{ unmountOnExit: !keepMounted }}
        ref={ref}
        sx={(theme) => getStyles({ theme })}
        {...opts}
      >
        <AccordionSummary
          className="summary"
          expandIcon={<ExpandIcon />}
          {...summaryProps}
        >
          <Typography className="title">
            {typeof title === 'string' ? translate(title) : title}
          </Typography>
          {hasTag && <Tag title={String(tag)} />}
        </AccordionSummary>
        <AccordionDetails className="content" {...contentProps}>
          {children}
        </AccordionDetails>
      </Accordion>
    )
  }
)

CollapsiblePanel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  isDefaultCollapsed: PropTypes.bool,
  keepMounted: PropTypes.bool,
  tag: PropTypes.node,
  title: PropTypes.node,
  contentProps: PropTypes.object,
  summaryProps: PropTypes.object,
}

CollapsiblePanel.displayName = 'CollapsiblePanel'
