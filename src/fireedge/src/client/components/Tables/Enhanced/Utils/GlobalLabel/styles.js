/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import {
  styled,
  InputBase,
  PopperProps,
  autocompleteClasses,
} from '@mui/material'

export const StyledInput = styled(InputBase)(
  ({ theme: { shape, palette, transitions } }) => ({
    padding: 10,
    width: '100%',
    '& input': {
      padding: 6,
      transition: transitions.create(['border-color', 'box-shadow']),
      border: `1px solid ${palette.divider}`,
      borderRadius: shape.borderRadius / 2,
      fontSize: 14,
      '&:focus': {
        boxShadow: `0px 0px 0px 3px ${palette.secondary[palette.mode]}`,
      },
    },
  })
)

export const StyledAutocompletePopper = styled('div')(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    margin: 0,
    color: 'inherit',
    fontSize: 13,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
    [`& .${autocompleteClasses.option}`]: {
      minHeight: 'auto',
      alignItems: 'flex-start',
      padding: 8,
      borderBottom: `1px solid  ${theme.palette.divider}`,
      '&[aria-selected="true"]': {
        backgroundColor: theme.palette.action.hover,
      },
      [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
        {
          backgroundColor: theme.palette.action.hover,
        },
    },
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: 'relative',
  },
}))

/**
 * @param {PopperProps} props - The props for the Popper component
 * @returns {ReactElement} Popper
 */
export const PopperComponent = ({
  disablePortal,
  anchorEl,
  open,
  ...other
}) => <StyledAutocompletePopper {...other} />

PopperComponent.propTypes = {
  anchorEl: PropTypes.any,
  disablePortal: PropTypes.bool,
  open: PropTypes.bool,
}
