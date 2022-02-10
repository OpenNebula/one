/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useState, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, NavArrowDown as CaretIcon } from 'iconoir-react'

import {
  Paper,
  useMediaQuery,
  Popper,
  Typography,
  useTheme,
  IconButton,
  Button,
  Fade,
  Box,
  buttonClasses,
  ClickAwayListener,
} from '@mui/material'

const HeaderPopover = memo(
  ({
    id,
    icon,
    buttonLabel,
    buttonProps,
    headerTitle,
    popperProps,
    children,
  }) => {
    const { zIndex } = useTheme()
    const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))

    const [open, setOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null)

    const handleClick = (event) => {
      setAnchorEl(isMobile ? window.document : event.currentTarget)
      setOpen((previousOpen) => !previousOpen)
    }

    const handleClose = () => setOpen(false)

    const mobileStyles = useMemo(
      () => ({
        ...(isMobile && {
          width: '100%',
          height: '100%',
        }),
      }),
      [isMobile]
    )

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
          onClick={handleClick}
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
        <Popper
          id={hasId}
          open={open}
          anchorEl={anchorEl}
          transition
          placement="bottom-end"
          keepMounted={false}
          style={{
            zIndex: zIndex.appBar + 1,
            ...mobileStyles,
          }}
          {...popperProps}
        >
          {({ TransitionProps }) => (
            <ClickAwayListener onClickAway={handleClose}>
              <Fade {...TransitionProps} timeout={300}>
                <Paper
                  variant="outlined"
                  style={mobileStyles}
                  sx={{ p: headerTitle ? 2 : 0 }}
                >
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
                  {children({ handleClose: handleClose })}
                </Paper>
              </Fade>
            </ClickAwayListener>
          )}
        </Popper>
      </>
    )
  }
)

HeaderPopover.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.node,
  buttonLabel: PropTypes.string,
  buttonProps: PropTypes.object,
  tooltip: PropTypes.any,
  headerTitle: PropTypes.any,
  disablePadding: PropTypes.bool,
  popperProps: PropTypes.object,
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
  children: () => undefined,
}

HeaderPopover.displayName = 'HeaderPopover'

export default HeaderPopover
