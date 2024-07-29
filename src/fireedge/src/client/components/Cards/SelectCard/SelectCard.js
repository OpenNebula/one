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
import { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
  Card,
  CardActionArea,
  CardHeader,
  CardActions,
  CardMedia,
  Skeleton,
} from '@mui/material'

import useNearScreen from 'client/hooks/useNearScreen'
import { ConditionalWrap } from 'client/components/HOC'

import { Action } from 'client/components/Cards/SelectCard'
import selectCardStyles from 'client/components/Cards/SelectCard/styles'

const SelectCard = memo(
  ({
    action,
    actions,
    cardActionsProps,
    cardHeaderProps,
    cardProps,
    cardActionAreaProps,
    children,
    dataCy,
    disableFilterImage,
    handleClick,
    icon,
    isSelected,
    mediaProps,
    observerOff,
    skeletonHeight,
    stylesProps,
    subheader,
    title,
  }) => {
    const classes = selectCardStyles({
      ...stylesProps,
      isSelected,
      disableFilterImage,
    })
    const { isNearScreen, fromRef } = useNearScreen({
      distance: '100px',
    })

    return (
      <ConditionalWrap
        condition={!observerOff}
        wrap={(children) => <span ref={fromRef}>{children}</span>}
      >
        {observerOff || isNearScreen ? (
          <Card
            {...cardProps}
            className={clsx(classes.root, cardProps?.className, {
              [classes.actionArea]: !handleClick,
            })}
            data-cy={dataCy ? `${dataCy}-card` : undefined}
          >
            {/* CARD ACTION AREA */}
            <ConditionalWrap
              condition={handleClick && !action}
              wrap={(children) => (
                <CardActionArea
                  {...cardActionAreaProps}
                  className={clsx(
                    classes.actionArea,
                    cardActionAreaProps?.className
                  )}
                  onClick={handleClick}
                  data-cy={dataCy && isSelected && `${dataCy}-card-selected`}
                >
                  {children}
                </CardActionArea>
              )}
            >
              {/* CARD HEADER */}
              {(title || subheader || icon || action) && (
                <CardHeader
                  {...cardHeaderProps}
                  action={action}
                  avatar={icon}
                  classes={{
                    root: classes.headerRoot,
                    content: classes.headerContent,
                    avatar: classes.headerAvatar,
                  }}
                  title={title}
                  titleTypographyProps={{
                    variant: 'body1',
                    noWrap: true,
                    className: classes.header,
                    title: typeof title === 'string' ? title : undefined,
                    ...(dataCy && { 'data-cy': `${dataCy}-card-title` }),
                  }}
                  subheader={subheader}
                  subheaderTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    className: classes.subheader,
                    title:
                      typeof subheader === 'string' ? subheader : undefined,
                    ...(dataCy && { 'data-cy': `${dataCy}-card-subheader` }),
                  }}
                  {...cardHeaderProps}
                />
              )}

              {/* CARD CONTENT */}
              {children}

              {/* CARD MEDIA */}
              {mediaProps && (
                <ConditionalWrap
                  condition={handleClick && action}
                  wrap={(children) => (
                    <CardActionArea
                      className={classes.mediaActionArea}
                      onClick={handleClick}
                    >
                      {children}
                    </CardActionArea>
                  )}
                >
                  <CardMedia className={classes.media} {...mediaProps} />
                </ConditionalWrap>
              )}

              {/* CARD ACTIONS */}
              {actions?.length > 0 && (
                <CardActions {...cardActionsProps}>
                  {actions?.map((actionProps) => (
                    <Action key={actionProps?.cy} {...actionProps} />
                  ))}
                </CardActions>
              )}
            </ConditionalWrap>
          </Card>
        ) : (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={skeletonHeight}
          />
        )}
      </ConditionalWrap>
    )
  }
)

export const SelectCardProps = {
  stylesProps: PropTypes.object,
  action: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.node.isRequired,
      cy: PropTypes.string,
    })
  ),
  cardActionsProps: PropTypes.shape({
    className: PropTypes.string,
    style: PropTypes.object,
  }),
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  subheader: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  cardHeaderProps: PropTypes.object,
  mediaProps: PropTypes.shape({
    classes: PropTypes.object,
    className: PropTypes.string,
    component: PropTypes.elementType,
    image: PropTypes.string,
    src: PropTypes.string,
    style: PropTypes.object,
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  cardProps: PropTypes.object,
  cardActionAreaProps: PropTypes.object,
  observerOff: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
  dataCy: PropTypes.string,
  disableFilterImage: PropTypes.bool,
  skeletonHeight: PropTypes.number,
}

SelectCard.defaultProps = {
  action: undefined,
  actions: undefined,
  cardActionsProps: undefined,
  cardHeaderProps: undefined,
  cardProps: {},
  cardActionAreaProps: {},
  children: undefined,
  dataCy: undefined,
  disableFilterImage: false,
  handleClick: undefined,
  icon: undefined,
  isSelected: false,
  mediaProps: undefined,
  observerOff: false,
  stylesProps: undefined,
  subheader: undefined,
  title: undefined,
  skeletonHeight: 140,
}

SelectCard.propTypes = SelectCardProps
SelectCard.displayName = 'SelectCard'

export default SelectCard
