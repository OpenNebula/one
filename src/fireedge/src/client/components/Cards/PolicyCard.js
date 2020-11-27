import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Card, CardContent, Button, CardActions } from '@material-ui/core'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    flexDirection: 'column'
  },
  content: {
    minHeight: 260
  }
}))

const PolicyCard = memo(
  ({ id, cy, fields, handleRemove, cardProps }) => {
    const classes = useStyles()

    return (
      <Card variant="outlined" className={classes.root} {...cardProps}>
        <CardContent className={classes.content}>
          <FormWithSchema id={id} cy={cy} fields={fields} />
        </CardContent>
        <CardActions>
          {handleRemove && (
            <Button variant="contained" size="small" onClick={handleRemove} disableElevation>
              {Tr(T.Remove)}
            </Button>
          )}
        </CardActions>
      </Card>
    )
  }
)

PolicyCard.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.object),
  handleEdit: PropTypes.func,
  handleClone: PropTypes.func,
  handleRemove: PropTypes.func,
  cardProps: PropTypes.object
}

PolicyCard.defaultProps = {
  id: undefined,
  cy: undefined,
  fields: undefined,
  handleEdit: undefined,
  handleClone: undefined,
  handleRemove: undefined,
  cardProps: undefined
}

PolicyCard.displayName = 'PolicyCard'

export default PolicyCard
