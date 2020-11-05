import React, { memo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import {
  makeStyles,
  Fade,
  Card,
  CardHeader,
  CardActionArea,
  CardContent,
  Typography
} from '@material-ui/core'
import ProvidersIcon from '@material-ui/icons/Public'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    minHeight: 140
  },
  selected: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    '& $badge': {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.common.white
    }
  },
  actionArea: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    overflowX: 'hidden',
    width: '100%'
  },
  content: {
    width: '100%',
    flexGrow: 1
  }
}))

const LocationCard = memo(
  ({ value, isSelected, handleClick }) => {
    const classes = useStyles()
    const { key, properties } = value

    return (
      <Fade in unmountOnExit={false}>
        <Card
          className={clsx(classes.root, { [classes.selected]: isSelected })}
        >
          <CardActionArea
            className={classes.actionArea}
            onClick={handleClick}
          >
            <CardHeader
              avatar={<ProvidersIcon />}
              className={classes.header}
              title={key}
              titleTypographyProps={{
                variant: 'body2',
                noWrap: true,
                title: key
              }}
            />
            {properties && <CardContent className={classes.content}>
              {Object.entries(properties)?.map(([pKey, pVal]) => (
                <Typography key={pKey} variant="body2">
                  <b>{pKey}</b>{` - ${pVal}`}
                </Typography>
              ))}
            </CardContent>}
          </CardActionArea>
        </Card>
      </Fade>
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

LocationCard.propTypes = {
  value: PropTypes.shape({
    key: PropTypes.string.isRequired,
    properties: PropTypes.object
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

LocationCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined
}

LocationCard.displayName = 'LocationCard'

export default LocationCard
