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
import { JSXElementConstructor, useMemo } from 'react'
import { css } from '@emotion/css'

import PropTypes from 'prop-types'
import { Box, Tooltip, useTheme } from '@mui/material'

import { TypographyWithPoint } from '@modules/components/Typography'
import { addOpacityToColor } from '@UtilsModule'

const useStyles = (theme) => ({
  legend: css({
    display: 'grid',
    gridGap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
  }),
  bar: css({
    marginTop: '1rem',
    display: 'grid',
    height: '1rem',
    width: '100%',
    backgroundColor: '#616161e0',
    transition: '1s',
    gridTemplateColumns: ({ fragments }) =>
      fragments?.map((fragment) => `${fragment}fr`)?.join(' '),
    [theme.breakpoints.only('xs')]: {
      display: 'none',
    },
  }),
})

/**
 * Represents a chart bar with legend.
 *
 * @param {object} props - Props
 * @param {{ name: string, color: string }[]} props.legend - Legend
 * @param {number[]} props.data - Chart data
 * @param {number} props.total - Total value of chart, equals to 100% of bar
 * @returns {JSXElementConstructor} Chart bar component
 */
const SingleBar = ({ legend, data, total = 0 }) => {
  const fragments = data.map((frag) => Math.floor((frag * 10) / (total || 1)))
  const theme = useTheme()
  const classes = useMemo(() => useStyles({ fragments }), [theme])

  return (
    <>
      {/* LEGEND */}
      <div className={classes.legend}>
        {legend?.map(({ name, color }, idx) => (
          <TypographyWithPoint
            key={name}
            pointColor={color}
            data-attr={data[idx]}
          >
            {name}
          </TypographyWithPoint>
        ))}
      </div>

      {/* BAR FRAGMENTS */}
      <div className={classes.bar}>
        {data?.map((value, idx) => {
          const label = legend[idx]?.name
          const color = legend[idx]?.color

          return (
            <Tooltip
              arrow
              key={label}
              placement="top"
              title={`${label}: ${value}`}
            >
              <Box
                sx={{
                  bgcolor: color,
                  '&:hover': { bgcolor: addOpacityToColor(color, 0.6) },
                }}
              />
            </Tooltip>
          )
        })}
      </div>
    </>
  )
}

SingleBar.propTypes = {
  legend: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      color: PropTypes.string,
    })
  ),
  data: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  total: PropTypes.number,
}

SingleBar.displayName = 'SingleBar'

export default SingleBar
