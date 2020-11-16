import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  CardActionArea,
  CardContent,
  Card,
  Grid,
  LinearProgress
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import { EmptyCard } from 'client/components/Cards'

const useStyles = makeStyles(() => ({
  cardPlus: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    textAlign: 'center'
  },
  loading: { width: '100%' }
}))

const ListCards = memo(({
  list,
  breakpoints,
  handleCreate,
  ButtonCreateComponent,
  CardComponent,
  cardsProps,
  EmptyComponent,
  displayEmpty,
  isLoading
}) => {
  const classes = useStyles()

  if (isLoading) {
    return <LinearProgress className={classes.loading} />
  }

  return (
    <Grid container spacing={3}>
      {/* CREATE CARD COMPONENT */}
      {handleCreate && (
        <Grid item {...breakpoints}>
          {ButtonCreateComponent ? (
            <ButtonCreateComponent onClick={handleCreate} />
          ) : (
            <Card className={classes.cardPlus} raised>
              <CardActionArea onClick={handleCreate}>
                <CardContent>
                  <AddIcon />
                </CardContent>
              </CardActionArea>
            </Card>
          )}
        </Grid>
      )}

      {/* LIST */}
      {list.length > 0 ? (
        list?.map((value, index) => (
          <Grid key={`card-${index}`} item {...breakpoints}>
            <CardComponent value={value} {...cardsProps({ index, value })} />
          </Grid>
        ))
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
