import React, { memo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { Card, CardActionArea, CardHeader, Fade, makeStyles } from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'

import useNearScreen from 'client/hooks/useNearScreen'
import ConditionalWrap from 'client/components/HOC/ConditionalWrap'

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
    },
    '& $subheader': {
      color: 'inherit'
    }
  },
  actionArea: {
    height: '100%',
    minHeight: 140,
    padding: theme.spacing(1)
  },
  headerContent: {
    overflowX: 'hidden'
  },
  subheader: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  }
}))

const SelectCard = memo(({
  title,
  subheader,
  icon,
  isSelected,
  handleClick,
  cardProps,
  observerOff,
  children
}) => {
  const classes = useStyles()
  const { isNearScreen, fromRef } = useNearScreen({
    distance: '100px'
  })

  return (
    <ConditionalWrap
      condition={!observerOff}
      wrap={children => <div ref={fromRef}>{children}</div>}>
      {observerOff || isNearScreen ? (
        <Fade in={observerOff || isNearScreen}>
          <Card
            className={clsx(classes.root, {
              [classes.actionArea]: !handleClick,
              [classes.selected]: isSelected
            })}
            {...cardProps}
          >
            <ConditionalWrap
              condition={handleClick}
              wrap={children =>
                <CardActionArea
                  className={classes.actionArea}
                  onClick={handleClick}>
                  {children}
                </CardActionArea>
              }
            >
              <CardHeader
                avatar={icon}
                classes={{ content: classes.headerContent }}
                title={title}
                titleTypographyProps={{
                  variant: 'body2',
                  noWrap: true,
                  title: title
                }}
                subheader={subheader}
                subheaderTypographyProps={{
                  variant: 'body2',
                  noWrap: true,
                  className: classes.subheader,
                  title: subheader
                }}
              />
              {children}
            </ConditionalWrap>
          </Card>
        </Fade>
      ) : (
        <Skeleton variant="rect" width="100%" height={140} />
      )}
    </ConditionalWrap>
  )
})

SelectCard.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  subheader: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  icon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  cardProps: PropTypes.object,
  observerOff: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ])
}

SelectCard.defaultProps = {
  title: undefined,
  subheader: undefined,
  icon: undefined,
  isSelected: false,
  handleClick: undefined,
  cardProps: undefined,
  observerOff: false,
  children: undefined
}

SelectCard.displayName = 'SelectCard'

export default SelectCard
