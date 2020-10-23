import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  Box,
  IconButton,
  useMediaQuery,
  Popover,
  Typography,
  Button
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'

import { Tr } from 'client/components/HOC'

import headerStyles from 'client/components/Header/styles'
import clsx from 'clsx'

const typeButton = {
  button: Button,
  iconButton: IconButton
}

const HeaderPopover = ({
  id,
  icon,
  buttonLabel,
  IconProps,
  headerTitle,
  disablePadding,
  children
}) => {
  const classes = headerStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

  const [anchorEl, setAnchorEl] = useState(null)

  const handleOpen = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const open = Boolean(anchorEl)
  const anchorId = open ? id : undefined

  const ButtonComponent = useMemo(
    () => (buttonLabel ? typeButton.button : typeButton.iconButton),
    [buttonLabel]
  )

  return (
    <>
      <ButtonComponent
        color="inherit"
        aria-controls={anchorId}
        aria-describedby={anchorId}
        aria-haspopup="true"
        onClick={handleOpen}
        {...IconProps}
      >
        {icon}
        {buttonLabel && (
          <span className={classes.buttonLabel}>{buttonLabel}</span>
        )}
      </ButtonComponent>
      <Popover
        BackdropProps={{ invisible: !isMobile }}
        PaperProps={{
          className: clsx(classes.paper, {
            [classes.padding]: !disablePadding
          })
        }}
        id={anchorId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {(headerTitle || isMobile) && (
          <Box className={classes.header}>
            {headerTitle && (
              <Typography className={classes.title} variant="body1">
                {Tr(headerTitle)}
              </Typography>
            )}
            {isMobile && (
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        )}
        {children({ handleClose })}
      </Popover>
    </>
  )
}

HeaderPopover.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.node,
  buttonLabel: PropTypes.string,
  IconProps: PropTypes.objectOf(PropTypes.any),
  headerTitle: PropTypes.string,
  disablePadding: PropTypes.bool,
  children: PropTypes.func
}

HeaderPopover.defaultProps = {
  id: 'id-popover',
  icon: null,
  buttonLabel: undefined,
  IconProps: {},
  headerTitle: null,
  disablePadding: false,
  children: () => undefined
}

export default HeaderPopover
