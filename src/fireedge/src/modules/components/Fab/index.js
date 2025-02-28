/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useMemo } from 'react'
import { useTheme, Fab } from '@mui/material'
import { css } from '@emotion/css'

import PropTypes from 'prop-types'
import clsx from 'clsx'

const useStyles = (theme) => ({
  root: css({
    transition: '0.5s ease',
    zIndex: theme.zIndex.appBar,
    position: 'absolute',
    bottom: 60,
    right: theme.spacing(5),
  }),
})

const FloatingActionButton = memo(({ icon, className, ...props }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  return (
    <Fab className={clsx(classes.root, className)} {...props}>
      {icon}
    </Fab>
  )
})

FloatingActionButton.propTypes = {
  icon: PropTypes.node.isRequired,
  className: PropTypes.string,
  color: PropTypes.oneOf(['inherit', 'primary', 'secondary']),
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['large', 'medium', 'small']),
  variant: PropTypes.oneOf(['extended', 'circular']),
}

FloatingActionButton.defaultProps = {
  icon: undefined,
  className: undefined,
  color: 'primary',
  disabled: false,
  size: 'large',
  variant: 'circular',
}

FloatingActionButton.displayName = 'FloatingActionButton'

export default FloatingActionButton
