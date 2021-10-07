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
import { memo, useState, useRef } from 'react'
import PropTypes from 'prop-types'

import { Box, useMediaQuery, Popover, Typography, Tooltip, IconButton, Button } from '@mui/material'
import { Cancel as CloseIcon, NavArrowDown as CaretIcon } from 'iconoir-react'

const HeaderPopover = memo(({
  id,
  icon,
  tooltip,
  buttonLabel,
  buttonProps,
  headerTitle,
  disablePadding,
  popoverProps,
  children
}) => {
  const [open, setOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const anchorRef = useRef(null)
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
    tooltip && setTooltipOpen(false)
  }

  const handleClose = () => setOpen(false)

  return (
    <>
      <Tooltip
        open={tooltipOpen}
        onOpen={() => tooltip && setTooltipOpen(!open)}
        onClose={() => tooltip && setTooltipOpen(false)}
        title={tooltip ?? ''}
        enterDelay={300}
      >
        <Button
          ref={anchorRef}
          aria-controls={open ? `${id}-popover` : undefined}
          aria-haspopup='true'
          onClick={handleToggle}
          size='small'
          sx={{ margin: '0 2px' }}
          endIcon={<CaretIcon />}
          {...buttonProps}
        >
          {icon}
          {buttonLabel && (
            <Box pl={1} sx={{ display: { xs: 'none', sm: 'block' } }}>
              {buttonLabel}
            </Box>
          )}
        </Button>
      </Tooltip>
      <Popover
        BackdropProps={{ invisible: !isMobile }}
        PaperProps={{
          sx: {
            ...(isMobile && {
              width: '100%',
              height: '100%'
            }),
            p: disablePadding ? 0 : 1
          }
        }}
        id={id}
        open={open}
        anchorEl={anchorRef.current}
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
          <Box
            display='flex'
            alignItems='center'
            justifyContent='flex-end'
            borderBottom='1px solid'
            borderBottomColor='action.disabledBackground'
          >
            {headerTitle && (
              <Typography sx={{ userSelect: 'none' }} variant='body1'>
                {headerTitle}
              </Typography>
            )}
            {isMobile && (
              <IconButton onClick={handleClose} size='large'>
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
  tooltip: PropTypes.any,
  headerTitle: PropTypes.any,
  disablePadding: PropTypes.bool,
  popoverProps: PropTypes.objectOf(PropTypes.any),
  children: PropTypes.func
}

HeaderPopover.defaultProps = {
  id: 'id-popover',
  icon: undefined,
  buttonLabel: undefined,
  tooltip: undefined,
  buttonProps: {},
  headerTitle: undefined,
  disablePadding: false,
  popoverProps: {},
  children: () => undefined
}

HeaderPopover.displayName = 'HeaderPopover'

export default HeaderPopover
