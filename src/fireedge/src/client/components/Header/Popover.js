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
/* eslint-disable jsdoc/require-jsdoc */
import { memo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, NavArrowDown as CaretIcon } from 'iconoir-react'

import {
  styled,
  useMediaQuery,
  Paper,
  Popper,
  Typography,
  IconButton,
  Button,
  Box,
  buttonClasses,
  ClickAwayListener,
} from '@mui/material'

const callAll =
  (...fns) =>
  (...args) =>
    fns.forEach((fn) => fn && fn?.(...args))

const StyledPopper = styled(Popper)(({ theme }) => ({
  boxShadow: theme.shadows[1],
  zIndex: theme.zIndex.modal + 1,
  [theme.breakpoints.down('xs')]: { width: '100%', height: '100%' },
}))

const StyledPaper = styled(Paper)(({ theme }) => ({
  [theme.breakpoints.down('xs')]: { width: '100%', height: '100%' },
}))

const HeaderPopover = memo(
  ({
    id,
    icon,
    buttonLabel,
    buttonProps: { onClick, ...buttonProps } = {},
    headerTitle,
    popperProps,
    onClickAway,
    children,
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

    useEffect(() => {
      !isMobile && open && setOpen(false)
    }, [isMobile])

    return (
      <>
        <Button
          aria-haspopup
          aria-describedby={hasId}
          aria-expanded={open ? 'true' : 'false'}
          onClick={callAll(handleClick, onClick)}
          size="small"
          endIcon={<CaretIcon />}
          startIcon={icon}
          sx={{
            [`.${buttonClasses.startIcon}`]: {
              mr: !isMobile && buttonLabel ? 1 : 0,
            },
          }}
          {...buttonProps}
        >
          {!isMobile && buttonLabel}
        </Button>
        <StyledPopper
          id={hasId}
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          keepMounted={false}
          {...popperProps}
        >
          <ClickAwayListener onClickAway={handleClose}>
            <StyledPaper variant="outlined" sx={{ p: headerTitle ? 2 : 0 }}>
              {(headerTitle || isMobile) && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  borderBottom="1px solid"
                  borderColor="divider"
                >
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

HeaderPopover.defaultProps = {
  id: 'id-popover',
  icon: undefined,
  buttonLabel: undefined,
  tooltip: undefined,
  buttonProps: {},
  headerTitle: undefined,
  disablePadding: false,
  popperProps: {},
  onClickAway: undefined,
  children: () => undefined,
}

HeaderPopover.displayName = 'HeaderPopover'

export default HeaderPopover
