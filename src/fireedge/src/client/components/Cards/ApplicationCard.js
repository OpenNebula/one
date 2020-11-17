import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles,
  Box,
  Button,
  CardContent,
  CardActions,
  Chip
} from '@material-ui/core'
import FileIcon from '@material-ui/icons/Description'

import { Tr } from 'client/components/HOC'
import { APPLICATION_STATES } from 'client/constants/states'
import SelectCard from './SelectCard'

const useStyles = makeStyles(theme => ({
  content: {
    display: 'flex',
    gap: theme.spacing(1)
  }
}))

const ApplicationCard = memo(
  ({ value, handleShow, handleRemove }) => {
    const classes = useStyles()
    const { ID, NAME, TEMPLATE } = value
    const { description, state } = TEMPLATE.BODY

    const stateInfo = APPLICATION_STATES[state]

    return (
      <SelectCard
        icon={<FileIcon />}
        title={`${ID} - ${NAME}`}
        subheader={description}
      >
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
      </SelectCard>
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
