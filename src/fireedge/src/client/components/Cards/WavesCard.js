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

import { styled, keyframes, lighten, darken } from '@mui/material'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import { Translate, Tr } from 'client/components/HOC'
import { SCHEMES } from 'client/constants'

const Card = styled(Paper)(({ theme, bgcolor, onClick }) => {
  const getBackgroundColor =
    theme.palette.mode === SCHEMES.DARK ? darken : lighten

  return {
    padding: '2em',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: getBackgroundColor(bgcolor, 0.3),
    ...(onClick && {
      '&:hover': {
        backgroundColor: getBackgroundColor(bgcolor, 0.4),
        boxShadow: theme.shadows[10],
        cursor: 'pointer',
      },
    }),
    [theme.breakpoints.only('xs')]: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '1em',
    },
  }
})

const OverSizeIcon = styled('span')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  width: '100%',
  height: '100%',
  textAlign: 'end',
  '& > svg': {
    color: theme.palette.action.active,
    height: '100%',
    width: '30%',
  },
}))

const drift = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Wave = styled('span')(({ theme, bgcolor, duration = 1 }) => {
  const getContrastBackgroundColor =
    theme.palette.mode === SCHEMES.DARK ? lighten : darken

  return {
    display: 'block',
    position: 'absolute',
    opacity: 0.4,
    top: '-5%',
    left: '50%',
    width: 220,
    height: 220,
    borderRadius: '43%',
    backgroundColor: getContrastBackgroundColor(bgcolor, duration / 10),
    animation: `${drift} ${duration}s infinite linear`,
  }
})

const WavesCard = memo(
  ({ text, value, bgColor, icon: Icon, onClick }) => (
    <Card title={Tr(text)} bgcolor={bgColor} onClick={onClick || undefined}>
      <Typography variant="h6" zIndex={2} noWrap>
        <Translate word={text} />
      </Typography>
      <Typography variant="h4" zIndex={2}>
        {value}
      </Typography>
      <Wave bgcolor={bgColor} duration={7} />
      <Wave bgcolor={bgColor} duration={5} />
      {Icon && (
        <OverSizeIcon>
          <Icon />
        </OverSizeIcon>
      )}
    </Card>
  ),
  (prev, next) => prev.value === next.value
)

WavesCard.propTypes = {
  text: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.element,
  ]),
  bgColor: PropTypes.string,
  icon: PropTypes.any,
  onClick: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
}

WavesCard.defaultProps = {
  text: undefined,
  value: undefined,
  bgColor: '#ffffff00',
  icon: undefined,
  onClick: undefined,
}

WavesCard.displayName = 'WavesCard'

export default WavesCard
