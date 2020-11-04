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
  CardActions,
  Chip
} from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'

import { Tr } from 'client/components/HOC'
import { APPLICATION_STATES } from 'client/constants/states'

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

const ApplicationCard = memo(
  ({ value, handleShow, handleRemove }) => {
    const classes = useStyles()
    const { ID, NAME, TEMPLATE } = value
    const { description, state } = TEMPLATE.BODY

    const stateInfo = APPLICATION_STATES[state]

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
            subheader={description}
            subheaderTypographyProps={{
              variant: 'body2',
              noWrap: true,
              className: classes.subheader,
              title: description
            }}
          />
          <CardContent>
            <Box className={classes.content}>
              <Chip
                size="small"
                label={stateInfo?.name}
                style={{ backgroundColor: stateInfo?.color }}
              />
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

ApplicationCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      BODY: PropTypes.shape({
        description: PropTypes.string,
        state: PropTypes.number,
        networks: PropTypes.object,
        roles: PropTypes.arrayOf(PropTypes.object)
      }).isRequired
    }).isRequired
  }),
  handleShow: PropTypes.func,
  handleRemove: PropTypes.func
}

ApplicationCard.defaultProps = {
  value: {},
  handleShow: undefined,
  handleRemove: undefined
}

ApplicationCard.displayName = 'Application TemplateCard'

export default ApplicationCard
