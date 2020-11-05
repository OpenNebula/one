import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles, Fade, Card, CardHeader, CardActionArea
} from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    flexDirection: 'column'
  },
  actionArea: {
    height: '100%'
  },
  headerContent: {
    overflowX: 'hidden'
  }
}))

const ProviderTemplateCard = memo(
  ({ value, handleClick }) => {
    const classes = useStyles()
    const { name } = value

    return (
      <Fade in unmountOnExit={false}>
        <Card className={classes.root}>
          <CardActionArea
            className={classes.actionArea}
            onClick={handleClick}
          >
            <CardHeader
              avatar={<FileIcon />}
              classes={{ content: classes.headerContent }}
              title={name}
              titleTypographyProps={{
                variant: 'body2',
                noWrap: true,
                title: name
              }}
            />
          </CardActionArea>
        </Card>
      </Fade>
    )
  }
)

ProviderTemplateCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  handleClick: PropTypes.func
}

ProviderTemplateCard.defaultProps = {
  value: {},
  handleClick: undefined
}

ProviderTemplateCard.displayName = 'ProviderTemplateCard'

export default ProviderTemplateCard
