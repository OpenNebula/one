import React, { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
  makeStyles, Card, CardActionArea, CardHeader, CardActions, IconButton
} from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'

import useNearScreen from 'client/hooks/useNearScreen'
import ConditionalWrap from 'client/components/HOC/ConditionalWrap'

const useStyles = makeStyles(theme => ({
  root: { height: '100%' },
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
    minHeight: ({ minHeight = 140 }) => minHeight,
    padding: theme.spacing(1)
  },
  headerAvatar: { display: 'flex' },
  headerContent: { overflowX: 'hidden' },
  subheader: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  },
  actionsIcon: { margin: theme.spacing(1) }
}))

const SelectCard = memo(({
  stylesProps,
  action,
  actions,
  icon,
  title,
  subheader,
  cardHeaderProps,
  isSelected,
  handleClick,
  cardProps,
  observerOff,
  children
}) => {
  const classes = useStyles(stylesProps)
  const { isNearScreen, fromRef } = useNearScreen({
    distance: '100px'
  })

  const renderAction = ({ handleClick, icon: Icon, iconColor, cy }) => (
    <IconButton key={cy} data-cy={cy} onClick={handleClick} size="small">
      <Icon color={iconColor} className={classes.actionsIcon} />
    </IconButton>
  )

  return (
    <ConditionalWrap
      condition={!observerOff}
      wrap={children => <div ref={fromRef}>{children}</div>}>
      {observerOff || isNearScreen ? (
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
                onClick={handleClick}
              >
                {children}
              </CardActionArea>
            }
          >
            <CardHeader
              action={action}
              avatar={icon}
              classes={{
                content: classes.headerContent,
                avatar: classes.headerAvatar
              }}
              title={title}
              titleTypographyProps={{
                variant: 'body2',
                noWrap: true,
                title
              }}
              subheader={subheader}
              subheaderTypographyProps={{
                variant: 'body2',
                noWrap: true,
                className: classes.subheader,
                title: subheader
              }}
              {...cardHeaderProps}
            />
            {children}
            {actions?.length > 0 && (
              <CardActions>
                {actions?.map(action => renderAction(action))}
              </CardActions>
            )}
          </ConditionalWrap>
        </Card>
      ) : (
        <Skeleton variant="rect" width="100%" height={140} />
      )}
    </ConditionalWrap>
  )
})

SelectCard.propTypes = {
  stylesProps: PropTypes.object,
  action: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      iconColor: PropTypes.oneOf([
        'inherit', 'primary', 'secondary', 'action', 'error', 'disabled'
      ]),
      cy: PropTypes.string
    })
  ),
  icon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  subheader: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  cardHeaderProps: PropTypes.shape({
    titleTypographyProps: PropTypes.object,
    subheaderTypographyProps: PropTypes.object
  }),
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
  stylesProps: undefined,
  action: undefined,
  actions: undefined,
  icon: undefined,
  title: undefined,
  subheader: undefined,
  cardHeaderProps: undefined,
  isSelected: false,
  handleClick: undefined,
  cardProps: undefined,
  observerOff: false,
  children: undefined
}

SelectCard.displayName = 'SelectCard'

export default SelectCard
