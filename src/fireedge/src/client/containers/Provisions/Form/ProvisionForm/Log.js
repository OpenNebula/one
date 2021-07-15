/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import * as React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'

import { makeStyles, IconButton, Typography } from '@material-ui/core'
import { NavArrowLeft as ArrowBackIcon } from 'iconoir-react'

import { useSocket } from 'client/hooks'
import DebugLog from 'client/components/DebugLog'
import { Translate } from 'client/components/HOC'
import { PATH } from 'client/apps/provision/routes'
import { T } from 'client/constants'

const useStyles = makeStyles({
  title: {
    marginBottom: '1em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.8em'
  }
})

const LogAfterCreateAction = ({ uuid }) => {
  const classes = useStyles()
  const history = useHistory()
  const { getProvisionSocket } = useSocket()
  const backToProvisionList = () => history.push(PATH.PROVISIONS.LIST)

  return (
    <DebugLog
      uuid={uuid}
      socket={getProvisionSocket}
      title={(
        <div className={classes.title}>
          <IconButton size='medium' onClick={backToProvisionList}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant='body1' component='span'>
            <Translate word={T.BackToList} values={T.Provisions} />
          </Typography>
        </div>
      )}
    />
  )
}

LogAfterCreateAction.propTypes = {
  uuid: PropTypes.string.isRequired
}

export default LogAfterCreateAction
