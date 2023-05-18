/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { memo } from 'react'

import {
  LinearProgress,
  Typography,
  linearProgressClasses,
  styled,
} from '@mui/material'

import { SCHEMES } from 'client/constants'

const getRangeColor = ({ value, high, low, palette }) => {
  if (low > value) return palette.success.main
  if (low < value && value < high) return palette.warning.main
  if (value > high) return palette.error.main
}

const BorderLinearProgress = styled(LinearProgress)(
  ({ theme: { palette }, value, high, low }) => ({
    height: 8,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: palette.grey[palette.mode === SCHEMES.LIGHT ? 400 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor:
        high || low
          ? getRangeColor({ value, high, low, palette })
          : palette.secondary.main,
    },
  })
)

const StyledTypography = styled(Typography)(({ theme, alert }) => ({
  ...(alert ? { color: theme.palette.error.main } : {}),
}))

const LinearProgressWithLabel = memo(
  ({ value, high, low, label, title, alert = false }) => (
    <div style={{ textAlign: 'end' }} title={title}>
      <StyledTypography component="span" variant="body2" noWrap alert={alert}>
        {label}
      </StyledTypography>
      <BorderLinearProgress
        variant="determinate"
        value={value}
        high={high}
        low={low}
      />
    </div>
  ),
  (prev, next) => prev.value === next.value && prev.label === next.label
)

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
  low: PropTypes.number,
  high: PropTypes.number,
  label: PropTypes.string.isRequired,
  title: PropTypes.string,
  alert: PropTypes.bool,
}

LinearProgressWithLabel.displayName = 'LinearProgressWithLabel'

export default LinearProgressWithLabel
