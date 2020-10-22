import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  Card,
  Button,
  CardHeader,
  CardActions,
  Badge
} from '@material-ui/core'
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows'

import { Tr } from 'client/components/HOC'

const useStyles = makeStyles(() => ({
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
  headerContent: {},
  title: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  }
}))

const TierCard = memo(
  ({ value, handleEdit, handleClone, handleRemove, cardProps }) => {
    const classes = useStyles()
    const { name, cardinality } = value

    return (
      <Card className={classes.root} {...cardProps}>
        <CardHeader
          avatar={
            <Badge
              badgeContent={cardinality}
              color="primary"
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left'
              }}
            >
              <DesktopWindowsIcon />
            </Badge>
          }
          className={classes.header}
          classes={{ content: classes.headerContent }}
          title={name}
          titleTypographyProps={{
            variant: 'body2',
            noWrap: true,
            className: classes.title,
            title: name
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
    )
  }
)

TierCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string,
    cardinality: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ])
  }),
  handleEdit: PropTypes.func,
  handleClone: PropTypes.func,
  handleRemove: PropTypes.func,
  cardProps: PropTypes.object
}

TierCard.defaultProps = {
  value: {},
  handleEdit: undefined,
  handleClone: undefined,
  handleRemove: undefined,
  cardProps: undefined
}

TierCard.displayName = 'TierCard'

export default TierCard
