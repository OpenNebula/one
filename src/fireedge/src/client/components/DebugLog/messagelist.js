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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import Message from 'client/components/DebugLog/message'
import { getMessageInfo } from 'client/components/DebugLog/utils'

const MessageList = ({ log = {}, filters = {} }) =>
  Object.entries(log)?.map(
    ([command, entries]) =>
      // filter by command
      (!filters.command || filters.command.includes(command)) &&
      Object.entries(entries)?.map(
        ([commandId, messages]) =>
          Array.isArray(messages) &&
          messages?.map((data, index) => {
            const { severity, ...messageInfo } = getMessageInfo(data)

            // filter by severity
            if (filters.severity && filters.severity !== severity) return null

            const key = `${index}-${command}-${commandId}`

            return <Message key={key} severity={severity} {...messageInfo} />
          })
      )
  )

MessageList.propTypes = {
  filters: PropTypes.shape({
    command: PropTypes.string,
    severity: PropTypes.string,
  }).isRequired,
  log: PropTypes.object,
}

MessageList.defaultProps = {
  filters: {
    command: undefined,
    severity: undefined,
  },
  log: undefined,
}

MessageList.displayName = 'MessageList'

export default MessageList
