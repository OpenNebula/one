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
import PropTypes from 'prop-types'

import { Typography } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

const useStateStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.text.secondary,
    '&::before': {
      content: "''",
      marginRight: '0.5rem',
      display: 'inline-flex',
      height: '0.7rem',
      width: '0.7rem',
      background: ({ color }) => color,
      borderRadius: '50%',
    },
  },
}))

const TypographyWithPoint = ({ pointColor, children, ...props }) => {
  const classes = useStateStyles({ color: pointColor })

  return (
    <Typography noWrap className={classes.root} {...props}>
      {children}
    </Typography>
  )
}

TypographyWithPoint.propTypes = {
  pointColor: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.element,
  ]),
}

TypographyWithPoint.defaultProps = {
  pointColor: undefined,
  children: undefined,
}

TypographyWithPoint.displayName = 'TypographyWithPoint'

export default TypographyWithPoint
