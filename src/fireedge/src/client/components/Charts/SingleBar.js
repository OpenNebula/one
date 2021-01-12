import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Tooltip } from '@material-ui/core'
import { TypographyWithPoint } from 'client/components/Typography'
import { addOpacityToColor } from 'client/utils'

const useStyles = makeStyles(() => ({
  legend: {
    display: 'grid',
    gridGap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))'
  },
  bar: {
    marginTop: '1rem',
    display: 'grid',
    height: '1rem',
    width: '100%',
    backgroundColor: '#616161e0',
    transition: '1s',
    gridTemplateColumns: ({ fragments }) =>
      fragments?.map(fragment => `${fragment}fr`)?.join(' ')
  }
}))

const SingleBar = ({ legend, data, total }) => {
  const fragments = data.map(data => Math.floor(data * 10 / (total || 1)))

  const classes = useStyles({ fragments })

  return (
    <>
      {/* LEGEND */}
      <div className={classes.legend}>
        {legend?.map(({ name, color }) => (
          <TypographyWithPoint key={name} pointColor={color}>
            {name}
          </TypographyWithPoint>
        ))}
      </div>

      {/* BAR FRAGMENTS */}
      <div className={classes.bar}>
        {data?.map((value, idx) => {
          const label = legend[idx]?.name
          const color = legend[idx]?.color
          const style = {
            backgroundColor: color,
            '&:hover': { backgroundColor: addOpacityToColor(color, 0.6) }
          }

          return (
            <Tooltip arrow key={label} placement="top" title={`${label}: ${value}`}>
              <div style={style}></div>
            </Tooltip>
          )
        })}
      </div>
    </>
  )
}

SingleBar.propTypes = {
  legend: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    color: PropTypes.string
  })),
  data: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ])
  ),
  total: PropTypes.number
}

SingleBar.defaultProps = {
  legend: undefined,
  data: undefined,
  total: 0
}

SingleBar.displayName = 'SingleBar'

export default SingleBar
