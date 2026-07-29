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
import { getStyles } from '@modules/componentsv2/composed/SearchBar/Default/slots/filter/styles'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { FilterList as FilterIcon } from 'iconoir-react'

/**
 * FilterSlot component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.label - Label text
 * @param {string} root0.hint - Hint text
 * @param {object} root0.children - Child elements
 * @param {string} root0.initialValue - Initial value
 * @returns {Component} - TextField component
 */
export const FilterSlot = forwardRef(
  ({ title = 'Filters', filterIcon = FilterIcon, onClick = () => {} }, ref) => (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      <Button
        dataCy="filter-by-button"
        title={title}
        startIcon={filterIcon}
        size="medium"
        type="secondary"
        onClick={onClick}
      />
    </Box>
  )
)

FilterSlot.propTypes = {
  onClick: PropTypes.func,
  filterIcon: PropTypes.node,
  title: PropTypes.string,
}

FilterSlot.displayName = 'FilterSlot'
