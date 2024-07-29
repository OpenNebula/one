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
import { memo, useState, useEffect, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { Box, CircularProgress, Typography } from '@mui/material'
import NumberEasing from 'client/components/NumberEasing'

/**
 * Circular progress bar with animation
 *
 * @param {object} props - Props
 * @param {string} props.color - Color of component: primary, secondary or inherit
 * @returns {JSXElementConstructor} Circular progress bar component
 */
const Circle = memo(
  ({ color = 'secondary' }) => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          const nextProgress = prevProgress + 2
          if (nextProgress === 100) clearInterval(timer)

          return nextProgress
        })
      }, 50)

      return () => clearInterval(timer)
    }, [])

    return (
      <CircularProgress
        color={color}
        size={150}
        thickness={5}
        value={progress}
        variant="determinate"
      />
    )
  },
  (prev, next) => prev.color === next.color
)

Circle.propTypes = { color: PropTypes.string }
Circle.displayName = 'Circle'

// -------------------------------------
// CHART
// -------------------------------------

/**
 * Circular chart with a label in the middle
 *
 * @param {object} props - Props
 * @param {string} props.label - Text in the middle
 * @param {object} props.labelProps - Props of text
 * @returns {JSXElementConstructor} Circular chart component
 */
const CircleChart = memo(
  ({ label, labelProps }) => (
    <Box position="relative" display="inline-flex" width={1}>
      <Box display="flex" flexDirection="column" alignItems="center" width={1}>
        <Circle />
      </Box>
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="h4"
          component="div"
          sx={{ cursor: 'pointer' }}
          {...labelProps}
        >
          <NumberEasing value={+label} />
        </Typography>
      </Box>
    </Box>
  ),
  (prev, next) => prev.label === next.label
)

CircleChart.propTypes = {
  label: PropTypes.string,
  labelProps: PropTypes.object,
}

CircleChart.displayName = 'CircleChart'

export default CircleChart
