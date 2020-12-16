import React, { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
  Card, CardActionArea, CardHeader, CardActions, CardMedia
} from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'

import useNearScreen from 'client/hooks/useNearScreen'
import ConditionalWrap from 'client/components/HOC/ConditionalWrap'
import Action from 'client/components/Cards/SelectCard/Action'
import selectCardStyles from 'client/components/Cards/SelectCard/styles'

const SelectCard = memo(({
  stylesProps,
  action,
  actions,
  cardActionsProps,
  icon,
  title,
  subheader,
  cardHeaderProps,
  mediaProps,
  isSelected,
  handleClick,
  cardProps,
  observerOff,
  children
}) => {
  const classes = selectCardStyles(stylesProps)
  const { isNearScreen, fromRef } = useNearScreen({
    distance: '100px'
  })

  return (
    <ConditionalWrap
      condition={!observerOff}
      wrap={children => <div ref={fromRef}>{children}</div>}>
      {observerOff || isNearScreen ? (
        <Card
          className={clsx(classes.root, cardProps?.className, {
            [classes.actionArea]: !handleClick,
            [classes.selected]: isSelected
          })}
          {...cardProps}
        >

          {/* CARD ACTION AREA */}
          <ConditionalWrap
            condition={handleClick && !action}
            wrap={children =>
              <CardActionArea
                className={classes.actionArea}
                onClick={handleClick}
              >
                {children}
              </CardActionArea>
            }
          >
            {/* CARD HEADER */}
            {(title || subheader || icon || action) && <CardHeader
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
                className: classes.header,
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
            />}

            {/* CARD CONTENT */}
            {children}

            {/* CARD MEDIA */}
            {mediaProps && (
              <ConditionalWrap
                condition={handleClick && action}
                wrap={children =>
                  <CardActionArea
                    className={classes.mediaActionArea}
                    onClick={handleClick}
                  >
                    {children}
                  </CardActionArea>
                }
              >
                <CardMedia className={classes.media} {...mediaProps} />
              </ConditionalWrap>
            )}

            {/* CARD ACTIONS */}
            {actions?.length > 0 && (
              <CardActions {...cardActionsProps}>
                {actions?.map(action => (
                  <Action key={action?.cy} {...action} />
                ))}
              </CardActions>
            )}
          </ConditionalWrap>
        </Card>
      ) : (
        <Skeleton
          variant="rect"
          width="100%"
          height={stylesProps?.minHeight ?? 140}
        />
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
      icon: PropTypes.node.isRequired,
      cy: PropTypes.string
    })
  ),
  cardActionsProps: PropTypes.shape({
    className: PropTypes.string,
    style: PropTypes.object
  }),
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
  mediaProps: PropTypes.shape({
    classes: PropTypes.object,
    className: PropTypes.string,
    component: PropTypes.elementType,
    image: PropTypes.string,
    src: PropTypes.string,
    style: PropTypes.object
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
  cardActionsProps: undefined,
  icon: undefined,
  title: undefined,
  subheader: undefined,
  cardHeaderProps: undefined,
  mediaProps: undefined,
  isSelected: false,
  handleClick: undefined,
  cardProps: {},
  observerOff: false,
  children: undefined
}

SelectCard.displayName = 'SelectCard'

export default SelectCard
