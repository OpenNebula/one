import React, { memo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { Card, CardActionArea, CardContent, CardHeader, Fade, makeStyles } from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'

import useNearScreen from 'client/hooks/useNearScreen'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  selected: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    '& .badge': {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.common.white
    }
  },
  actionArea: {
    height: '100%',
    minHeight: 140,
    padding: theme.spacing(1)
  },
  headerContent: {
    overflowX: 'hidden'
  }
}))

const SelectCard = memo(
  ({ title, icon, isSelected, handleClick, children }) => {
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
                <CardHeader
                  avatar={icon}
                  classes={{ content: classes.headerContent }}
                  title={title}
                  titleTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    title: title
                  }}
                />
                {children && <CardContent>{children}</CardContent>}
              </CardActionArea>
            </Card>
          </Fade>
        ) : (
          <Skeleton variant="rect" width="100%" height={140} />
        )}
      </div>
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

SelectCard.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  icon: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ])
}

SelectCard.defaultProps = {
  title: undefined,
  icon: undefined,
  isSelected: false,
  handleClick: () => undefined,
  children: undefined
}

SelectCard.displayName = 'SelectCard'

export default SelectCard
