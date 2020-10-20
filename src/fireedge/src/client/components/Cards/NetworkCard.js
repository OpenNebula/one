import React from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  Card,
  Button,
  CardHeader,
  CardActions,
  Fade
} from '@material-ui/core'

import { Tr } from 'client/components/HOC'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    overflowX: 'hidden',
    flexGrow: 1
  },
  subheader: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  },
  remove: {
    backgroundColor: theme.palette.error.dark
  }
}))

const NetworkCard = React.memo(
  ({ value, handleEdit, handleClone, handleRemove }) => {
    const classes = useStyles()
    const { mandatory, name, description } = value

    return (
      <Fade in unmountOnExit={false}>
        <Card className={classes.root}>
          <CardHeader
            avatar={mandatory ? 'M' : ''}
            className={classes.header}
            classes={{ content: classes.headerContent }}
            title={name}
            titleTypographyProps={{
              variant: 'body2',
              noWrap: true,
              title: name
            }}
            subheader={description}
            subheaderTypographyProps={{
              variant: 'body2',
              noWrap: true,
              className: classes.subheader,
              title: description
            }}
          />
          <CardActions>
            {handleEdit && (
              <Button variant="contained" size="small" onClick={handleEdit} disableElevation>
                {Tr('Edit')}
              </Button>
            )}
            {handleClone && (
              <Button variant="contained" size="small" onClick={handleClone} disableElevation>
                {Tr('Clone')}
              </Button>
            )}
            {handleRemove && (
              <Button size="small" onClick={handleRemove} disableElevation>
                {Tr('Remove')}
              </Button>
            )}
          </CardActions>
        </Card>
      </Fade>
    )
  }
)

NetworkCard.propTypes = {
  value: PropTypes.shape({
    mandatory: PropTypes.bool,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string,
    id: PropTypes.string,
    extra: PropTypes.string
  }),
  handleEdit: PropTypes.func,
  handleClone: PropTypes.func,
  handleRemove: PropTypes.func
}

NetworkCard.defaultProps = {
  value: {},
  handleEdit: undefined,
  handleClone: undefined,
  handleRemove: undefined
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
