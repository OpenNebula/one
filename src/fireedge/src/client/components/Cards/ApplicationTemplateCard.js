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

import { Box, Badge, Button, CardContent, CardActions } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import {
  Page as FileIcon,
  HardDrive as HostIcon,
  Network as NetworkIcon,
} from 'iconoir-react'

import SelectCard from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles((theme) => ({
  badgesWrapper: {
    display: 'flex',
    gap: theme.typography.pxToRem(12),
  },
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
      <SelectCard icon={<FileIcon />} title={NAME} subheader={description}>
        <CardContent>
          <Box className={classes.badgesWrapper}>
            <Badge
              showZero
              title={Tr(T.Tiers)}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={numberOfTiers}
              anchorOrigin={badgePosition}
            >
              <HostIcon />
            </Badge>
            <Badge
              showZero
              title={Tr(T.Networks)}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={numberOfNetworks}
              anchorOrigin={badgePosition}
            >
              <NetworkIcon />
            </Badge>
          </Box>
        </CardContent>
        <CardActions>
          {handleEdit && (
            <Button
              variant="contained"
              size="small"
              onClick={handleEdit}
              disableElevation
            >
              {Tr(T.Edit)}
            </Button>
          )}
          {handleDeploy && (
            <Button
              variant="contained"
              size="small"
              onClick={handleDeploy}
              disableElevation
            >
              {Tr(T.Deploy)}
            </Button>
          )}
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
  }
)

ApplicationTemplateCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      BODY: PropTypes.shape({
        description: PropTypes.string,
        networks: PropTypes.object,
        roles: PropTypes.arrayOf(PropTypes.object),
      }).isRequired,
    }).isRequired,
  }),
  handleEdit: PropTypes.func,
  handleDeploy: PropTypes.func,
  handleShow: PropTypes.func,
  handleRemove: PropTypes.func,
}

ApplicationTemplateCard.defaultProps = {
  value: {},
  handleEdit: undefined,
  handleDeploy: undefined,
  handleShow: undefined,
  handleRemove: undefined,
}

ApplicationTemplateCard.displayName = 'Application TemplateCard'

export default ApplicationTemplateCard
