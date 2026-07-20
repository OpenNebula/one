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

import PropTypes from 'prop-types'
import { forwardRef, useEffect, useState } from 'react'
import { Box, Drawer, Popper, Typography, useTheme } from '@mui/material'
import { Cancel, FilterList } from 'iconoir-react'

import { T } from '@ConstantsModule'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Dropdown } from '@modules/componentsv2/primitives/Dropdown'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import {
  getPopperStyles,
  getStyles,
} from '@modules/componentsv2/composed/FilterPanel/Default/styles'
import {
  cleanFilterValues,
  getAllFilterOption,
  getFilterValue,
  getOptionValue,
} from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const FilterPopper = forwardRef(({ style, ...props }, ref) => {
  const theme = useTheme()

  return (
    <Popper
      {...props}
      ref={ref}
      style={{ ...style, ...getPopperStyles({ theme }) }}
    />
  )
})

FilterPopper.propTypes = { style: PropTypes.object }
FilterPopper.displayName = 'FilterPopper'

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.open - Whether the panel is open
 * @param {Function} root0.onClose - Close handler
 * @param {Array} root0.filters - Filter definitions
 * @param {object} root0.values - Applied filter values
 * @param {Function} root0.onApply - Apply handler
 * @returns {Element} Filter panel
 */
export const FilterPanel = ({
  open = false,
  onClose,
  filters = [],
  values = {},
  onApply,
}) => {
  const { translate } = useTranslation()
  const theme = useTheme()
  const [draftValues, setDraftValues] = useState(() =>
    cleanFilterValues(values)
  )

  useEffect(() => {
    if (open) setDraftValues(cleanFilterValues(values))
  }, [open, values])

  const updateValue = (id, value) => {
    setDraftValues((currentValues) => {
      const nextValues = { ...currentValues }

      if (value === undefined || value === null || value === '') {
        delete nextValues[id]
      } else {
        nextValues[id] = value
      }

      return nextValues
    })
  }

  const handleApply = () => {
    onApply?.(cleanFilterValues(draftValues))
    onClose?.()
  }

  const renderFilter = (filter) => {
    const value = getFilterValue(draftValues, filter.id)

    if (filter.type === 'number' || filter.type === 'text') {
      return (
        <InputField
          inputProps={{ 'data-cy': `filter-${filter.id}` }}
          value={value ?? ''}
          type={filter.type === 'number' ? 'number' : 'text'}
          placeholder={filter.placeholder}
          onChange={(nextValue) => updateValue(filter.id, nextValue)}
        />
      )
    }

    const options = [getAllFilterOption(filter), ...(filter.options ?? [])]
    const selectedOption =
      options.find(
        (option) => String(getOptionValue(option)) === String(value)
      ) ?? options[0]

    return (
      <Dropdown
        dataCy={`filter-${filter.id}`}
        options={options}
        initialValue={selectedOption}
        placeholder={filter.placeholder}
        onChange={(option) => updateValue(filter.id, getOptionValue(option))}
        PopperComponent={FilterPopper}
      />
    )
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ ...getStyles({ theme }) }}
      ModalProps={{
        BackdropProps: {
          className: 'filterpanel-backdrop',
        },
      }}
      PaperProps={{
        className: 'filterpanel-paper',
      }}
    >
      <Box className="filterpanel-root">
        <Box className="filterpanel-header">
          <Typography className="filterpanel-title">
            {translate(T.Filters)}
          </Typography>
          <Button
            type="transparent"
            size="small"
            iconOnly={Cancel}
            onClick={onClose}
            title={T.Close}
          />
        </Box>

        <Box className="filterpanel-content">
          {filters.map((filter) => (
            <Box key={filter.id} className="filterpanel-field">
              <Typography className="filterpanel-label">
                {translate(filter.label)}
              </Typography>
              {renderFilter(filter)}
            </Box>
          ))}
        </Box>

        <Box className="filterpanel-footer">
          <Button
            dataCy="filter-apply"
            startIcon={FilterList}
            size="medium"
            className="filterpanel-apply-button"
            onClick={handleApply}
          >
            {`${translate(T.Apply)} ${translate(T.Filters)}`.trim()}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

FilterPanel.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      placeholder: PropTypes.string,
      allText: PropTypes.string,
      options: PropTypes.array,
    })
  ),
  values: PropTypes.object,
  onApply: PropTypes.func,
}

FilterPanel.displayName = 'FilterPanel'
