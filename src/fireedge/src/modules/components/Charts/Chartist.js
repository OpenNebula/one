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
import PropTypes from 'prop-types'
import {
  useTheme,
  CircularProgress,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { css } from '@emotion/css'
import { useMemo, JSXElementConstructor } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush,
  ResponsiveContainer,
} from 'recharts'

const useStyles = ({ palette, typography }) => ({
  graphStyle: css({
    '&': {
      width: '100% !important',
    },
  }),
  box: css({
    paddingBottom: '0px',
  }),
  title: css({
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
  }),
  center: css({
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  }),
})

const calculateDerivative = (data) =>
  data
    .map((point, i, array) => {
      if (i === array.length - 1) {
        return null
      }
      const nextPoint = array[i + 1]

      return {
        x: point.x,
        y: (nextPoint.y - point.y) / ((nextPoint.x - point.x) / 1000),
      }
    })
    .filter((point) => point)

/**
 * Represents a Chartist Graph.
 *
 * @param {object} props - Props
 * @param {object[]} props.data - Chart data
 * @param {string} props.name - Chartist name
 * @param {string} props.filter - Chartist filter
 * @param {string} props.x - Chartist X
 * @param {Array|string} props.y - Chartist Y
 * @param {Function} props.interpolationY - Chartist interpolation Y
 * @param {boolean} props.derivative - Display delta values
 * @param {boolean} props.enableLegend - Enable graph legend
 * @param {Array} props.legendNames - List of legend names
 * @param {Array} props.lineColors - Array of line colors
 * @returns {JSXElementConstructor} Chartist component
 */
const Chartist = ({
  data = [],
  name = '',
  filter = [],
  x = '',
  y = '',
  interpolationY = (value) => value,
  derivative = false,
  enableLegend = false,
  legendNames = [],
  lineColors = [],
}) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  const dataChart = filter?.length
    ? useMemo(() => {
        let filteredData = data
        if (filter.length) {
          filteredData = data.filter((point) =>
            Object.keys(point).some((key) => filter.includes(key))
          )
        }

        return filteredData.map((point) => ({
          x:
            x === 'TIMESTAMP'
              ? new Date(+point[x] * 1000).getTime()
              : +point[x],
          ...(Array.isArray(y)
            ? Object.fromEntries(y.map((pt) => [pt, Math.round(+point[pt])]))
            : { y: Math.round(+point[y]) }),
        }))
      }, [data, filter, x, y])
    : []

  const processedData = derivative ? calculateDerivative(dataChart) : dataChart

  return (
    <Paper
      variant="outlined"
      sx={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
    >
      <List className={classes.box} sx={{ width: '100%', height: '100%' }}>
        <ListItem className={classes.title}>
          <Typography noWrap>{name}</Typography>
        </ListItem>
        <ListItem className={classes.center}>
          {!data?.length ? (
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              sx={{ width: '100%', height: '100%' }}
            >
              <CircularProgress color="secondary" />
            </Stack>
          ) : (
            <div style={{ width: '100%', height: '500px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  className={classes.graphStyle}
                  data={processedData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    axisLine={true}
                    tickFormatter={(val) => new Date(val).toLocaleString()}
                  />
                  <YAxis
                    axisLine={true}
                    tickFormatter={(val) => interpolationY(val)}
                  />
                  <Tooltip
                    labelFormatter={(val) => new Date(val).toLocaleString()}
                  />
                  {Array.isArray(y) ? (
                    y.map((yValue, index) => (
                      <Line
                        key={`${yValue}-${index}`}
                        name={legendNames?.[index] ?? ''}
                        dataKey={yValue}
                        stroke={lineColors?.[index] ?? '#039be5'}
                        dot={false}
                        type="linear"
                      />
                    ))
                  ) : (
                    <Line
                      name={name}
                      dataKey="y"
                      stroke={lineColors?.[0] ?? '#039be5'}
                      dot={false}
                      type="linear"
                    />
                  )}
                  {enableLegend && (
                    <Legend verticalAlign="bottom" height={36} />
                  )}
                  <Brush dataKey="x" height={30} stroke="#757575" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ListItem>
      </List>
    </Paper>
  )
}

Chartist.propTypes = {
  name: PropTypes.string,
  filter: PropTypes.arrayOf(PropTypes.string),
  data: PropTypes.array,
  x: PropTypes.string,
  y: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]),
  interpolationY: PropTypes.func,
  derivative: PropTypes.bool,
  enableLegend: PropTypes.bool,
  legendNames: PropTypes.arrayOf(PropTypes.string),
  lineColors: PropTypes.arrayOf(PropTypes.string),
}

Chartist.displayName = 'Chartist'

export default Chartist
