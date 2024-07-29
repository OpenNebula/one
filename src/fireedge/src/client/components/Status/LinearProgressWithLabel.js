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
import PropTypes from 'prop-types'
import { memo } from 'react'

import {
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  Typography,
  linearProgressClasses,
  styled,
  tooltipClasses,
} from '@mui/material'

import { StatusCircle } from 'client/components/Status'

import { Tr } from 'client/components/HOC'
import { SCHEMES, T } from 'client/constants'

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

const StyledTypography = styled(Typography)(({ theme, color }) => ({
  ...(color && theme.palette[color]?.main
    ? { color: theme.palette[color].main }
    : {}),
}))

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: theme.typography.pxToRem(170),
  },
}))

const StyledChip = styled(Chip)(({ theme, colorSvg }) => ({
  '&': {
    color: theme.palette.common.white,
    marginBottom: theme.typography.pxToRem(1),
  },
  '& svg': {
    marginLeft: theme.typography.pxToRem(12),
    ...(colorSvg ? { color: theme.palette[colorSvg].main } : {}),
  },
}))

const LinearProgressWithLabel = memo(
  ({ value, high, low, label, title, color = '' }) => (
    <div style={{ textAlign: 'end' }}>
      <StyledTypography component="span" variant="body2" noWrap color={color}>
        {label}
      </StyledTypography>
      <StyledTooltip
        arrow
        title={
          <Grid container>
            <Grid item xs={12}>
              <Typography>{title}</Typography>
            </Grid>
            <Grid item xs={12}>
              <StyledChip
                colorSvg="success"
                icon={<StatusCircle />}
                label={Tr(T.Low)}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledChip
                colorSvg="warning"
                icon={<StatusCircle />}
                label={Tr(T.Medium)}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledChip
                colorSvg="error"
                icon={<StatusCircle />}
                label={Tr(T.High)}
              />
            </Grid>
          </Grid>
        }
      >
        <BorderLinearProgress
          variant="determinate"
          value={value}
          high={high}
          low={low}
        />
      </StyledTooltip>
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
  color: PropTypes.string,
}

LinearProgressWithLabel.displayName = 'LinearProgressWithLabel'

export default LinearProgressWithLabel
