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

import {
  CircularProgress,
  Stack,
  Paper,
  List,
  ListItem,
  Typography,
} from '@mui/material'
import {
  Chart,
  ArgumentAxis,
  ValueAxis,
  LineSeries,
  ZoomAndPan,
} from '@devexpress/dx-react-chart-material-ui'
import { scaleTime } from 'd3-scale'
import { ArgumentScale, ValueScale } from '@devexpress/dx-react-chart'
import makeStyles from '@mui/styles/makeStyles'

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

/**
 * Represents a Chartist Graph.
 *
 * @param {object} props - Props
 * @param {object[]} props.data - Chart data
 * @param {string} props.name - Chartist name
 * @param {string} props.filter - Chartist filter
 * @param {string} props.x - Chartist X
 * @param {string} props.y - Chartist X
 * @param {Function} props.interpolationY - Chartist interpolation Y
 * @returns {JSXElementConstructor} Chartist component
 */
const Chartist = ({
  data = [],
  name = '',
  filter = [],
  x = '',
  y = '',
  interpolationY = (value) => value,
}) => {
  const classes = useStyles()

  const dataChart = filter?.length
    ? useMemo(
        () =>
          data
            ?.filter(
              (point) =>
                !!Object.keys(point).find((key) => filter.includes(key))
            )
            .map((point, i) => ({
              x: x === 'TIMESTAMP' ? new Date(+point[x] * 1000) : +point[x],
              y: Math.round(+point[y]),
            })),
        [data]
      )
    : []

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
              data={dataChart}
              height={300}
              width={500}
              className={classes.graphStyle}
            >
              <ArgumentScale factory={scaleTime} />
              <ArgumentAxis showLine={true} />
              <ValueScale />
              <ValueAxis showLine={true} tickFormat={() => interpolationY} />
              <LineSeries name={name} valueField="y" argumentField="x" />
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
  interpolationY: PropTypes.func,
}

Chartist.displayName = 'Chartist'

export default Chartist
