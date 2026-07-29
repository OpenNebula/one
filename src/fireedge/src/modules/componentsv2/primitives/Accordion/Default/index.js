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
import { Component, useState, forwardRef } from 'react'
import PropTypes from 'prop-types'
import {
  Accordion as MUIAccordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from '@mui/material'
import { NavArrowDown as ExpandIcon } from 'iconoir-react'
import { getStyles } from '@modules/componentsv2/primitives/Accordion/Default/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} params - Params
 * @param {Array} params.options - List of options [{title,description}]
 * @param {boolean} params.isMultipleExpandable - Can expand multiple sections at once
 * @returns {Component} - Accordion component
 */
export const Accordion = forwardRef(
  ({ options = [], isMultipleExpandable = false, ...opts }, ref) => {
    const { translate } = useTranslation()
    const [expanded, setExpanded] = useState([])

    return (
      <Box sx={(theme) => getStyles({ theme })} ref={ref} {...opts}>
        {[].concat(options)?.map(({ title, description }, idx) => {
          const id = `${title}-${idx}`
          const isExpanded = expanded?.includes(id)

          return (
            <MUIAccordion
              disableGutters
              key={idx}
              className={`accordion-base${
                isExpanded ? ' accordion-expanded' : ''
              }`}
              expanded={isExpanded}
              onChange={(_, expand) => {
                setExpanded((prev) =>
                  expand
                    ? [id]?.concat(isMultipleExpandable ? prev : [])
                    : prev?.filter((i) => i !== id)
                )
              }}
              TransitionProps={{
                timeout: 0,
              }}
            >
              <AccordionSummary
                className="accordion-summary"
                expandIcon={<ExpandIcon />}
              >
                <Typography className="accordion-title" component="div">
                  {typeof title === 'string' ? translate(title) : title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className="accordion-details">
                <Typography className="accordion-description" component="div">
                  {typeof description === 'string'
                    ? translate(description)
                    : description}
                </Typography>
              </AccordionDetails>
            </MUIAccordion>
          )
        })}
      </Box>
    )
  }
)

Accordion.propTypes = {
  options: PropTypes.array,
  isMultipleExpandable: PropTypes.bool,
}

Accordion.displayName = 'Accordion'
