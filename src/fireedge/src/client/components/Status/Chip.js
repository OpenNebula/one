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

import { makeStyles, Typography, lighten, darken } from '@material-ui/core'
import { addOpacityToColor } from 'client/utils'
import { SCHEMES } from 'client/constants'

const useStyles = makeStyles(theme => {
  const getBackgroundColor = theme.palette.type === SCHEMES.DARK ? lighten : darken
  const defaultStateColor = theme.palette.grey[theme.palette.type === SCHEMES.DARK ? 300 : 700]

  return {
    root: ({ stateColor = defaultStateColor }) => ({
      color: getBackgroundColor(stateColor, 0.75),
      backgroundColor: addOpacityToColor(stateColor, 0.2),
      cursor: 'default',
      padding: theme.spacing('0.25rem', '0.5rem'),
      borderRadius: 2,
      textTransform: 'uppercase',
      fontSize: theme.typography.overline.fontSize,
      fontWeight: theme.typography.fontWeightBold
    })
  }
})

const StatusChip = memo(({ stateColor, text = '', ...props }) => {
  const classes = useStyles({ stateColor })

  return (
    <Typography component='span' className={classes.root} {...props}>
      {text}
    </Typography>
  )
},
(prev, next) =>
  prev.stateColor === next.stateColor &&
  prev.text === next.text
)

StatusChip.propTypes = {
  stateColor: PropTypes.string,
  text: PropTypes.string
}

StatusChip.displayName = 'StatusChip'

export default StatusChip
