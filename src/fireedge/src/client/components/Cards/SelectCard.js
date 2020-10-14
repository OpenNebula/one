import React, { memo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { Card, CardActionArea, Fade, makeStyles } from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'

import useNearScreen from 'client/hooks/useNearScreen'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  selected: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main
  },
  actionArea: {
    height: '100%',
    minHeight: 140,
    padding: theme.spacing(1)
  }
}))

const SelectCard = memo(
  ({ title, isSelected, handleClick }) => {
    const classes = useStyles()
    const { isNearScreen, fromRef } = useNearScreen({
      distance: '100px'
    })

    return (
      <div ref={fromRef}>
        {isNearScreen ? (
          <Fade in={isNearScreen}>
            <Card className={clsx(classes.root, { [classes.selected]: isSelected })}>
              <CardActionArea className={classes.actionArea} onClick={handleClick}>
                <span>{title}</span>
              </CardActionArea>
            </Card>
          </Fade>
        ) : (
          <Skeleton variant="rect" width="100%" height={140} />
        )}
      </div>
    )
  }
)

SelectCard.propTypes = {
  title: PropTypes.string,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

SelectCard.defaultProps = {
  title: undefined,
  isSelected: false,
  handleClick: () => undefined
}

SelectCard.displayName = 'SelectCard'

export default SelectCard
