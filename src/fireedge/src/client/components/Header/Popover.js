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
import { memo, useState, useRef, useMemo, useEffect } from 'react'
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
  Box
} from '@mui/material'

const HeaderPopover = memo(({
  id,
  icon,
  buttonLabel,
  buttonProps,
  headerTitle,
  popoverProps,
  children
}) => {
  const { zIndex } = useTheme()
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

  const [open, setOpen] = useState(false)
  const [fix, setFix] = useState(false)
  const anchorRef = useRef(null)

  const handleToggle = () => isMobile && setFix(prevFix => !prevFix)

  const mobileStyles = useMemo(() => ({
    ...(isMobile && {
      width: '100%',
      height: '100%'
    })
  }), [isMobile])

  useEffect(() => {
    !isMobile && fix && setFix(false)
  }, [isMobile])

  return (
    <div {...!isMobile && {
      onMouseOver: () => setOpen(true),
      onFocus: () => setOpen(true),
      onMouseOut: () => setOpen(false)
    }}>
      <Button
        ref={anchorRef}
        aria-controls={open ? `${id}-popover` : undefined}
        aria-haspopup
        aria-expanded={open ? 'true' : 'false'}
        onClick={handleToggle}
        size='small'
        sx={{ margin: '0 2px' }}
        endIcon={<CaretIcon />}
        startIcon={icon}
        {...buttonProps}
      >
        {!isMobile && buttonLabel}
      </Button>
      <Popper
        id={id}
        open={fix || open}
        anchorEl={isMobile ? window.document : anchorRef.current}
        transition
        placement='bottom-end'
        keepMounted={false}
        style={{
          zIndex: zIndex.appBar + 1,
          ...mobileStyles
        }}
        {...popoverProps}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              variant='outlined'
              style={mobileStyles}
              sx={{ p: headerTitle ? 2 : 0 }}
            >
              {(headerTitle || isMobile) && (
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='space-between'
                  borderBottom='1px solid'
                  borderColor='divider'
                >
                  {headerTitle && (
                    <Typography variant='body1'>
                      {headerTitle}
                    </Typography>
                  )}
                  {isMobile && (
                    <IconButton onClick={handleToggle} size='large'>
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              )}
              {children({ handleClose: handleToggle })}
            </Paper>
          </Fade>
        )}
      </Popper>
    </div>
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
