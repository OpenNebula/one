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
import { useEffect, useState, memo } from 'react'
import PropTypes from 'prop-types'

import makeStyles from '@mui/styles/makeStyles'

import AutoScrollBox from 'client/components/AutoScrollBox'
import MessageList from 'client/components/DebugLog/messagelist'
import Filters from 'client/components/DebugLog/filters'
import * as LogUtils from 'client/components/DebugLog/utils'

const debugLogStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
    overflow: 'auto',
  },
  containerScroll: {
    width: '100%',
    flexGrow: 1,
    overflow: 'auto',
    borderRadius: 5,
    backgroundColor: '#1d1f21',
    wordBreak: 'break-word',
  },
}))

const DebugLog = memo(
  ({ uuid, socket, logDefault, title }) => {
    const classes = debugLogStyles()

    const [log, setLog] = useState(logDefault)

    const [filters, setFilters] = useState(() => ({
      command: undefined,
      severity: undefined,
    }))

    useEffect(() => {
      const { on, off } = socket((socketData = {}) => {
        socketData.id === uuid &&
          setLog((prevLog) =>
            LogUtils.concatNewMessageToLog(prevLog, socketData)
          )
      })

      uuid && on()

      return off
    }, [])

    return (
      <div className={classes.root}>
        {title}

        <Filters log={log} filters={filters} setFilters={setFilters} />

        <div className={classes.containerScroll}>
          <AutoScrollBox scrollBehavior="auto">
            <MessageList log={log} filters={filters} />
          </AutoScrollBox>
        </div>
      </div>
    )
  },
  (prev, next) => prev.uuid === next.uuid
)

DebugLog.propTypes = {
  uuid: PropTypes.string,
  socket: PropTypes.func.isRequired,
  logDefault: PropTypes.object,
  title: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
}

DebugLog.defaultProps = {
  uuid: undefined,
  socket: {
    on: () => undefined,
    off: () => undefined,
  },
  logDefault: {},
  title: null,
}

DebugLog.displayName = 'DebugLog'

export default DebugLog

export { LogUtils }
