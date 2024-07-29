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
import { JSXElementConstructor, useMemo } from 'react'

import { ArgumentScale, ValueScale } from '@devexpress/dx-react-chart'
import {
  ArgumentAxis,
  Legend,
  Chart,
  LineSeries,
  ValueAxis,
  ZoomAndPan,
} from '@devexpress/dx-react-chart-material-ui'
import {
  CircularProgress,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { scaleTime } from 'd3-scale'

const useStyles = makeStyles(({ palette, typography }) => ({
  graphStyle: {
    '&': {
      width: '100% !important',
    },
  },
  box: {
    paddingBottom: '0px',
  },
  title: {
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
  },
  center: {
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
    justifyContent: 'center',
  },
}))

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
  const classes = useStyles()

  const dataChart = filter?.length
    ? useMemo(() => {
        let filteredData = data
        if (filter.length) {
          filteredData = data.filter((point) =>
            Object.keys(point).some((key) => filter.includes(key))
          )
        }

        return filteredData.map((point) => ({
          x: x === 'TIMESTAMP' ? new Date(+point[x] * 1000) : +point[x],
          ...(Array.isArray(y)
            ? Object.fromEntries(y.map((pt) => [pt, Math.round(+point[pt])]))
            : { y: Math.round(+point[y]) }),
        }))
      }, [data])
    : []

  const processedData = derivative ? calculateDerivative(dataChart) : dataChart

  return (
    <Paper variant="outlined" sx={{ height: 'fit-content' }}>
      <List className={classes.box}>
        <ListItem className={classes.title}>
          <Typography noWrap>{name}</Typography>
        </ListItem>
        <ListItem className={classes.center}>
          {!data?.length ? (
            <Stack direction="row" justifyContent="center" alignItems="center">
              <CircularProgress color="secondary" />
            </Stack>
          ) : (
            <Chart
              data={processedData}
              height={300}
              width={500}
              className={classes.graphStyle}
            >
              <ArgumentScale factory={scaleTime} />
              <ArgumentAxis showLine={true} />
              <ValueScale />
              <ValueAxis showLine={true} tickFormat={() => interpolationY} />
              {Array.isArray(y) ? (
                y.map((yValue, index) => (
                  <LineSeries
                    key={`${yValue}-${index}`}
                    name={legendNames?.[index] ?? ''}
                    valueField={yValue}
                    argumentField="x"
                    {...(lineColors?.[index] && { color: lineColors?.[index] })}
                  />
                ))
              ) : (
                <LineSeries name={name} valueField="y" argumentField="x" />
              )}
              {enableLegend && <Legend position="bottom" />}

              <ZoomAndPan />
            </Chart>
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
