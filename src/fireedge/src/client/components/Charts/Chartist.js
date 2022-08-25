/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import 'chartist/dist/chartist.min.css'

import {
  Grid,
  CircularProgress,
  Stack,
  Paper,
  List,
  ListItem,
  Typography,
} from '@mui/material'
import ChartistGraph from 'react-chartist'
import { FixedScaleAxis } from 'chartist'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles(({ palette, typography }) => ({
  graphStyle: {
    '& .ct-series-a .ct-bar, .ct-series-a .ct-line, .ct-series-a .ct-point, .ct-series-a .ct-slice-donut':
      { stroke: palette.secondary.main, strokeWidth: '1px' },
    '& .ct-grid': {
      stroke: 'rgba(150,150,150,.1)',
      strokeDasharray: '1px',
    },
    '&': {
      width: '100%',
    },
  },
  box: {
    paddingBottom: '0px',
  },
  title: {
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
  },
}))

/**
 * Represents a Chartist Graph.
 *
 * @param {object} props - Props
 * @param {object[]} props.data - Chart data
 * @param {Function} props.interpolationX - Chartist interpolation X
 * @param {Function} props.interpolationY - Chartist interpolation Y
 * @param {string} props.name - Chartist name
 * @param {string} props.filter - Chartist filter
 * @param {string} props.x - Chartist X
 * @param {string} props.y - Chartist X
 * @returns {JSXElementConstructor} Chartist component
 */
const Chartist = ({
  data = [],
  interpolationX,
  interpolationY,
  name = '',
  filter = [],
  x = '',
  y = '',
}) => {
  const classes = useStyles()

  const chartOptions = {
    fullWidth: true,
    reverseData: true,
    low: 0,
    scaleMinSpace: 10,
    axisX: {
      type: FixedScaleAxis,
      divisor: 10,
    },
    axisY: {
      offset: 70,
    },
  }

  const dataChart = {
    name,
  }

  typeof interpolationX === 'function' &&
    (chartOptions.axisX.labelInterpolationFnc = interpolationX)

  typeof interpolationY === 'function' &&
    (chartOptions.axisY.labelInterpolationFnc = interpolationY)

  filter?.length &&
    (dataChart.data = useMemo(
      () =>
        data
          ?.filter((point) =>
            Object.keys(point).find((key) => filter.includes(key))
          )
          .map((point) => ({
            x: +point[x],
            y: +point[y],
          })),
      [data]
    ))

  return (
    <Grid item xs={12} sm={6}>
      {!data?.length ? (
        <Stack direction="row" justifyContent="center" alignItems="center">
          <CircularProgress color="secondary" />
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ height: 'fit-content' }}>
          <List className={classes.box}>
            <ListItem className={classes.title}>
              <Typography noWrap>{name}</Typography>
            </ListItem>
            <ListItem className={classes.title}>
              <ChartistGraph
                className={classes.graphStyle}
                data={{ series: [dataChart] }}
                options={chartOptions}
                type="Line"
              />
            </ListItem>
          </List>
        </Paper>
      )}
    </Grid>
  )
}

Chartist.propTypes = {
  name: PropTypes.string,
  filter: PropTypes.arrayOf(PropTypes.string),
  data: PropTypes.arrayOf(
    PropTypes.shape({
      TIMESTAMP: PropTypes.string,
      DISK_SIZE: PropTypes.arrayOf(PropTypes.shape({})),
      ID: PropTypes.string,
      CPU: PropTypes.string,
      DISKRDBYTES: PropTypes.string,
      DISKRDIOPS: PropTypes.string,
      DISKWRBYTES: PropTypes.string,
      DISKWRIOPS: PropTypes.string,
      MEMORY: PropTypes.string,
      NETRX: PropTypes.string,
      NETTX: PropTypes.string,
    })
  ),
  x: PropTypes.string,
  y: PropTypes.string,
  interpolationX: PropTypes.func,
  interpolationY: PropTypes.func,
}

Chartist.displayName = 'Chartist'

export default Chartist
