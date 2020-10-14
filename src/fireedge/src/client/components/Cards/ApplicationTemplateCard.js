import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  Box,
  Fade,
  Badge,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions
} from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'
import VideogameAssetIcon from '@material-ui/icons/VideogameAsset'
import AccountTreeIcon from '@material-ui/icons/AccountTree'

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
  badgesWrapper: {
    display: 'flex',
    gap: theme.typography.pxToRem(12)
  },
  badge: {},
  icon: {}
}))

const ApplicationTemplateCard = memo(
  ({ value, handleEdit, handleDeploy, handleShow, handleRemove }) => {
    const classes = useStyles()
    const { NAME, TEMPLATE } = value
    const { description, networks = [], roles = [] } = TEMPLATE.BODY

    const numberOfTiers = roles?.length ?? 0
    const numberOfNetworks = Object.keys(networks)?.length ?? 0

    const badgePosition = { vertical: 'top', horizontal: 'right' }

    return (
      <Fade in unmountOnExit={false}>
        <Card className={classes.root}>
          <CardHeader
            avatar={<FileIcon />}
            className={classes.header}
            classes={{ content: classes.headerContent }}
            title={NAME}
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
            <Box className={classes.badgesWrapper}>
              <Badge
                showZero
                title={Tr('Tiers')}
                classes={{ badge: classes.badge }}
                color="primary"
                badgeContent={numberOfTiers}
                anchorOrigin={badgePosition}
              >
                <VideogameAssetIcon />
              </Badge>
              <Badge
                showZero
                title={Tr('Networks')}
                classes={{ badge: classes.badge }}
                color="primary"
                badgeContent={numberOfNetworks}
                anchorOrigin={badgePosition}
              >
                <AccountTreeIcon />
              </Badge>
            </Box>
          </CardContent>
          <CardActions>
            {handleEdit && (
              <Button variant="contained" size="small" onClick={handleEdit}>
                {Tr('Edit')}
              </Button>
            )}
            {handleDeploy && (
              <Button variant="contained" size="small" onClick={handleDeploy}>
                {Tr('Deploy')}
              </Button>
            )}
            {handleShow && (
              <Button variant="contained" size="small" onClick={handleShow}>
                {Tr('Info')}
              </Button>
            )}
            {handleRemove && (
              <Button size="small" onClick={handleRemove}>
                {Tr('Remove')}
              </Button>
            )}
          </CardActions>
        </Card>
      </Fade>
    )
  }
)

ApplicationTemplateCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      BODY: PropTypes.shape({
        description: PropTypes.string,
        networks: PropTypes.object,
        roles: PropTypes.arrayOf(PropTypes.object)
      }).isRequired
    }).isRequired
  }),
  handleEdit: PropTypes.func,
  handleDeploy: PropTypes.func,
  handleShow: PropTypes.func,
  handleRemove: PropTypes.func
}

ApplicationTemplateCard.defaultProps = {
  value: {},
  handleEdit: undefined,
  handleDeploy: undefined,
  handleShow: undefined,
  handleRemove: undefined
}

ApplicationTemplateCard.displayName = 'Application TemplateCard'

export default ApplicationTemplateCard
