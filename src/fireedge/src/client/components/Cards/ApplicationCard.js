/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Box, Button, CardContent, CardActions, Chip } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Page as FileIcon } from 'iconoir-react'

import SelectCard from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T, APPLICATION_STATES } from 'client/constants'

const useStyles = makeStyles((theme) => ({
  content: {
    display: 'flex',
    gap: theme.spacing(1),
  },
}))

const ApplicationCard = memo(({ value, handleShow, handleRemove }) => {
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
          <Button
            variant="contained"
            size="small"
            onClick={handleShow}
            disableElevation
          >
            {Tr(T.Info)}
          </Button>
        )}
        {handleRemove && (
          <Button size="small" onClick={handleRemove} disableElevation>
            {Tr(T.Remove)}
          </Button>
        )}
      </CardActions>
    </SelectCard>
  )
})

ApplicationCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      BODY: PropTypes.shape({
        description: PropTypes.string,
        state: PropTypes.number,
        networks: PropTypes.object,
        roles: PropTypes.arrayOf(PropTypes.object),
      }).isRequired,
    }).isRequired,
  }),
  handleShow: PropTypes.func,
  handleRemove: PropTypes.func,
}

ApplicationCard.defaultProps = {
  value: {},
  handleShow: undefined,
  handleRemove: undefined,
}

ApplicationCard.displayName = 'Application TemplateCard'

export default ApplicationCard
