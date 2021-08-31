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
import { memo, useState } from 'react'
import PropTypes from 'prop-types'

import {
  Box,
  IconButton,
  useMediaQuery,
  Popover,
  Typography,
  Button
} from '@material-ui/core'
import { Cancel as CloseIcon } from 'iconoir-react'
import clsx from 'clsx'

import { Tr } from 'client/components/HOC'
import headerStyles from 'client/components/Header/styles'

const HeaderPopover = memo(({
  id,
  icon,
  buttonLabel,
  buttonProps,
  headerTitle,
  disablePadding,
  popoverProps,
  children
}) => {
  const classes = headerStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

  const [anchorEl, setAnchorEl] = useState(null)

  const handleOpen = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const open = Boolean(anchorEl)
  const anchorId = open ? id : undefined

  return (
    <>
      <Button
        color='inherit'
        aria-controls={anchorId}
        aria-describedby={anchorId}
        aria-haspopup='true'
        variant='outlined'
        onClick={handleOpen}
        size='small'
        {...buttonProps}
        style={{ margin: '0 2px' }}
      >
        {icon}
        {buttonLabel && (
          <span className={classes.buttonLabel}>{buttonLabel}</span>
        )}
      </Button>
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
        {...popoverProps}
      >
        {(headerTitle || isMobile) && (
          <Box className={classes.header}>
            {headerTitle && (
              <Typography className={classes.title} variant='body1'>
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
})

HeaderPopover.propTypes = {
  id: PropTypes.string,
  icon: PropTypes.node,
  buttonLabel: PropTypes.string,
  buttonProps: PropTypes.objectOf(PropTypes.any),
  headerTitle: PropTypes.string,
  disablePadding: PropTypes.bool,
  popoverProps: PropTypes.objectOf(PropTypes.any),
  children: PropTypes.func
}

HeaderPopover.defaultProps = {
  id: 'id-popover',
  icon: null,
  buttonLabel: undefined,
  buttonProps: {},
  headerTitle: null,
  disablePadding: false,
  popoverProps: {},
  children: () => undefined
}

HeaderPopover.displayName = 'HeaderPopover'

export default HeaderPopover
