import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { withStyles, Badge, Typography } from '@material-ui/core'

const StyledBadge = withStyles(() => ({
  badge: {
    right: -25,
    top: 13,
    fontSize: '0.7rem'
  }
}))(Badge)

const DevTypography = memo(({ label, labelProps, color, badgeProps }) => {
  return (
    <StyledBadge badgeContent="DEV" color={color} {...badgeProps}>
      <Typography {...labelProps}>{label}</Typography>
    </StyledBadge>
  )
})

DevTypography.propTypes = {
  label: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string.isRequired
  ]),
  labelProps: PropTypes.object,
  color: PropTypes.string,
  badgeProps: PropTypes.object
}

DevTypography.defaultProps = {
  label: '',
  labelProps: undefined,
  color: 'primary',
  badgeProps: undefined
}

DevTypography.displayName = 'DevTypography'

export default DevTypography
