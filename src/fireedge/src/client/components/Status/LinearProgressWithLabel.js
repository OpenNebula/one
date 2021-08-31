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

import { withStyles } from '@material-ui/core/styles'
import { Typography, LinearProgress } from '@material-ui/core'

const BorderLinearProgress = withStyles(({ palette }) => ({
  root: {
    height: 15,
    borderRadius: 5
  },
  colorPrimary: {
    backgroundColor: palette.grey[palette.type === 'light' ? 400 : 700]
  },
  bar: {
    borderRadius: 5,
    backgroundColor: palette.primary.main
  }
}))(LinearProgress)

const LinearProgressWithLabel = memo(({ value, label, title }) => (
  <div style={{ textAlign: 'end' }} title={title}>
    <Typography component='span' variant='body2' noWrap>{label}</Typography>
    <BorderLinearProgress variant='determinate' value={value} />
  </div>
), (prev, next) => prev.value === next.value && prev.label === next.label)

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  title: PropTypes.string
}

LinearProgressWithLabel.displayName = 'LinearProgressWithLabel'

export default LinearProgressWithLabel
