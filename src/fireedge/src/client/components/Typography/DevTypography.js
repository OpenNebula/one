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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Typography, Chip } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    gap: '1em',
    width: '100%'
  },
  label: {
    flexGrow: 1
  }
})

const DevTypography = memo(({ label, labelProps, color, chipProps }) => {
  const classes = useStyles()

  return (
    <span className={classes.root}>
      <Typography {...labelProps} className={classes.label}>
        {label}
      </Typography>
      <Chip size='small' label='DEV' color={color} {...chipProps} />
    </span>
  )
})

DevTypography.propTypes = {
  chipProps: PropTypes.object,
  color: PropTypes.string,
  label: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string.isRequired
  ]),
  labelProps: PropTypes.object
}

DevTypography.defaultProps = {
  chipProps: undefined,
  color: 'secondary',
  label: '',
  labelProps: undefined
}

DevTypography.displayName = 'DevTypography'

export default DevTypography
