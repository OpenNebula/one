import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  Box,
  Fade,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions
} from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'

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
  content: {
    display: 'flex',
    gap: theme.typography.pxToRem(12)
  }
}))

const ProviderCard = memo(
  ({ value, handleShow, handleRemove }) => {
    const classes = useStyles()
    const { ID, NAME, DESCRIPTION } = value

    return (
      <Fade in unmountOnExit={false}>
        <Card className={classes.root}>
          <CardHeader
            avatar={<FileIcon />}
            className={classes.header}
            classes={{ content: classes.headerContent }}
            title={`${ID} - ${NAME}`}
            titleTypographyProps={{
              variant: 'body2',
              noWrap: true,
              title: NAME
            }}
            subheader={DESCRIPTION}
            subheaderTypographyProps={{
              variant: 'body2',
              noWrap: true,
              className: classes.subheader,
              title: DESCRIPTION
            }}
          />
          <CardContent>
            <Box className={classes.content}>
              {'content'}
            </Box>
          </CardContent>
          <CardActions>
            {handleShow && (
              <Button variant="contained" size="small" onClick={handleShow} disableElevation>
                {Tr('Info')}
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

ProviderCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    DESCRIPTION: PropTypes.string
  }),
  handleShow: PropTypes.func,
  handleRemove: PropTypes.func
}

ProviderCard.defaultProps = {
  value: {},
  handleShow: undefined,
  handleRemove: undefined
}

ProviderCard.displayName = 'ProviderCard'

export default ProviderCard
