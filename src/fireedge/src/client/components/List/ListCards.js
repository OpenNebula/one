import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  CardActionArea,
  CardContent,
  Card,
  Grid
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

const useStyles = makeStyles(() => ({
  cardPlus: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    textAlign: 'center'
  }
}))

function ListCards ({ handleCreate, list, CardComponent, cardsProps }) {
  const classes = useStyles()

  return (
    <Grid container spacing={3}>
      {handleCreate &&
        useMemo(
          () => (
            <Grid item xs={12} sm={4} md={3} lg={2}>
              <Card className={classes.cardPlus} raised>
                <CardActionArea onClick={handleCreate}>
                  <CardContent>
                    <AddIcon />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ),
          [handleCreate, classes]
        )}
      {Array.isArray(list) &&
        list?.map((value, index) => (
          <Grid key={`card-${index}`} item xs={12} sm={4} md={3} lg={2}>
            <CardComponent value={value} {...cardsProps({ index, value })} />
          </Grid>
        ))}
    </Grid>
  )
}

ListCards.propTypes = {
  list: PropTypes.arrayOf(PropTypes.any).isRequired,
  handleCreate: PropTypes.func,
  CardComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.object,
    PropTypes.element
  ]),
  cardsProps: PropTypes.func
}

ListCards.defaultProps = {
  list: [],
  handleCreate: undefined,
  CardComponent: null,
  cardsProps: () => undefined
}

export default ListCards
