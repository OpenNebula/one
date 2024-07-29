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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Badge } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles({
  badge: {
    backgroundColor: ({ stateColor }) => stateColor,
    color: ({ stateColor }) => stateColor,
    transform: ({ customTransform }) => customTransform,
    boxShadow: '0 0 0 2px transparent',
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: '$ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    from: {
      transform: 'scale(.8)',
      opacity: 1,
    },
    to: {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
})

const StatusBadge = memo(
  ({ stateColor, children, customTransform, ...props }) => {
    const classes = useStyles({ stateColor, customTransform })

    return (
      <Badge
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        classes={{ badge: classes.badge }}
        overlap="circular"
        variant="dot"
        {...props}
      >
        {children}
      </Badge>
    )
  },
  (prev, next) => prev.stateColor === next.stateColor
)

StatusBadge.propTypes = {
  stateColor: PropTypes.string,
  customTransform: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
}

StatusBadge.defaultProps = {
  stateColor: undefined,
  customTransform: undefined,
  children: '',
}

StatusBadge.displayName = 'StatusBadge'

export default StatusBadge
