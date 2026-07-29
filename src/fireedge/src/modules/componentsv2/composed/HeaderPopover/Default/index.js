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
import { memo, useEffect, useState } from 'react'
import { Cancel as CloseIcon, NavArrowDown as CaretIcon } from 'iconoir-react'
import {
  Box,
  ClickAwayListener,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material'

import { SubmitButton } from '@modules/componentsv2/primitives/Buttons/Submit'
import {
  getButtonStyles,
  getMobileHeaderStyles,
  getPaperStyles,
  StyledPaper,
  StyledPopper,
} from '@modules/componentsv2/composed/HeaderPopover/Default/styles'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach((fn) => fn && fn?.(...args))

/**
 * @param {object} props - Header popover props
 * @param {string} props.id - Popover id
 * @param {Node} props.icon - Button start icon
 * @param {Node} props.buttonLabel - Button label
 * @param {object} props.buttonProps - Button props
 * @param {Node} props.headerTitle - Popover header title
 * @param {object} props.popperProps - Popper props
 * @param {Function} props.onClickAway - Click away handler
 * @param {Function} props.children - Popover content renderer
 * @returns {Node} Header popover
 */
export const HeaderPopover = memo(
  ({
    id = 'id-popover',
    icon,
    buttonLabel,
    buttonProps: { onClick, ...buttonProps } = {},
    headerTitle,
    popperProps,
    onClickAway,
    children = () => undefined,
  }) => {
    const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

    const [open, setOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null)

    const handleClick = (event) => {
      setAnchorEl(isMobile ? window.document : event.currentTarget)
      setOpen((previousOpen) => !previousOpen)
    }

    const handleClose = callAll(onClickAway, () => setOpen(false))
    const canBeOpen = open && Boolean(anchorEl)
    const hasId = canBeOpen ? id : undefined
    const hasButtonLabel = !!buttonLabel

    useEffect(() => {
      !isMobile && open && setOpen(false)
    }, [isMobile])

    return (
      <>
        <SubmitButton
          aria-haspopup
          aria-describedby={hasId}
          aria-expanded={open ? 'true' : 'false'}
          onClick={callAll(handleClick, onClick)}
          label={buttonLabel}
          endIcon={<CaretIcon />}
          startIcon={icon}
          sx={() => getButtonStyles({ isMobile, hasButtonLabel })}
          {...buttonProps}
        >
          {!isMobile && buttonLabel}
        </SubmitButton>
        <StyledPopper
          id={hasId}
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          keepMounted={false}
          {...popperProps}
        >
          <ClickAwayListener onClickAway={handleClose}>
            <StyledPaper
              variant="outlined"
              sx={(theme) =>
                getPaperStyles({ theme, hasHeaderTitle: !!headerTitle })
              }
            >
              {(headerTitle || isMobile) && (
                <Box sx={(theme) => getMobileHeaderStyles({ theme })}>
                  {headerTitle && (
                    <Typography variant="body1">{headerTitle}</Typography>
                  )}
                  {isMobile && (
                    <IconButton onClick={handleClose} size="large">
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              )}
              {children({ handleClose })}
            </StyledPaper>
          </ClickAwayListener>
        </StyledPopper>
      </>
    )
  }
)

HeaderPopover.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.node,
  buttonLabel: PropTypes.any,
  buttonProps: PropTypes.object,
  tooltip: PropTypes.any,
  headerTitle: PropTypes.any,
  disablePadding: PropTypes.bool,
  popperProps: PropTypes.object,
  onClickAway: PropTypes.func,
  children: PropTypes.func,
}

HeaderPopover.displayName = 'HeaderPopover'

export default HeaderPopover
