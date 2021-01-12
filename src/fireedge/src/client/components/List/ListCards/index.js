import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import {
  CardActionArea, Card, Grid, LinearProgress, useMediaQuery
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

import { EmptyCard } from 'client/components/Cards'
import FloatingActionButton from 'client/components/Fab'
import listCardsStyles from 'client/components/List/ListCards/styles'

const ListCards = memo(({
  list,
  keyProp,
  breakpoints,
  handleCreate,
  ButtonCreateComponent,
  CardComponent,
  cardsProps,
  EmptyComponent,
  displayEmpty,
  isLoading
}) => {
  const classes = listCardsStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

  if (isLoading) {
    return <LinearProgress color='secondary' className={classes.loading} />
  }

  return (
    <Grid container spacing={3}>
      {/* CREATE CARD COMPONENT */}
      {handleCreate && (ButtonCreateComponent ? (
        <ButtonCreateComponent onClick={handleCreate} />
      ) : (
        isMobile ? (
          <FloatingActionButton icon={<AddIcon />} onClick={handleCreate} />
        ) : (
          <Grid item {...breakpoints}>
            <Card className={classes.cardPlus} raised>
              <CardActionArea onClick={handleCreate}>
                <AddIcon />
              </CardActionArea>
            </Card>
          </Grid>
        )
      ))}

      {/* LIST */}
      {list.length > 0 ? (
        <TransitionGroup component={null}>
          {list?.map((value, index) => {
            const key = value[keyProp] ?? value[keyProp.toUpperCase()]

            return (
              <CSSTransition
                // use key to render transition (default: id or ID)
                key={`card-${key.replace(/\s/g, '')}`}
                classNames={classes.item}
                timeout={400}
              >
                <Grid item {...breakpoints} {...value?.breakpoints}>
                  <CardComponent value={value} {...cardsProps({ index, value })} />
                </Grid>
              </CSSTransition>
            )
          })}
        </TransitionGroup>
      ) : (
        (displayEmpty || EmptyComponent) && (
          <Grid item {...breakpoints}>
            {EmptyComponent ?? <EmptyCard title={'Your list is empty'} />}
          </Grid>
        )
      )}
    </Grid>
  )
})

const gridValues = [false, 'auto', true, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

ListCards.propTypes = {
  list: PropTypes.arrayOf(PropTypes.any).isRequired,
  keyProp: PropTypes.string,
  breakpoints: PropTypes.shape({
    xs: PropTypes.oneOf(gridValues),
    sm: PropTypes.oneOf(gridValues),
    md: PropTypes.oneOf(gridValues),
    lg: PropTypes.oneOf(gridValues),
    xl: PropTypes.oneOf(gridValues)
  }),
  handleCreate: PropTypes.func,
  ButtonCreateComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.object,
    PropTypes.element
  ]),
  CardComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.object,
    PropTypes.element
  ]),
  cardsProps: PropTypes.func,
  EmptyComponent: PropTypes.oneOfType([
    PropTypes.element
  ]),
  displayEmpty: PropTypes.bool,
  isLoading: PropTypes.bool
}

ListCards.defaultProps = {
  list: [],
  keyProp: 'id',
  breakpoints: { xs: 12, sm: 4, md: 3, lg: 2 },
  handleCreate: undefined,
  ButtonCreateComponent: undefined,
  CardComponent: null,
  cardsProps: () => undefined,
  EmptyComponent: undefined,
  displayEmpty: false,
  isLoading: false
}

ListCards.displayName = 'ListCards'

export default ListCards
