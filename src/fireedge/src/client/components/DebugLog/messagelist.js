import * as React from 'react'
import PropTypes from 'prop-types'

import Message from 'client/components/DebugLog/message'
import { getMessageInfo } from 'client/components/DebugLog/utils'

const MessageList = ({ log = {}, filters = {} }) =>
  Object.entries(log)?.map(([command, entries]) => (
  // filter by command
    (!filters.command || filters.command.includes(command)) && (
      Object.entries(entries)?.map(([commandId, messages]) =>
        Array.isArray(messages) && messages?.map((data, index) => {
          const { severity, ...messageInfo } = getMessageInfo(data)

          // filter by severity
          if (filters.severity && filters.severity !== severity) return null

          const key = `${index}-${command}-${commandId}`

          return (
            <Message key={key} severity={severity} {...messageInfo} />
          )
        })
      )
    )
  ))

MessageList.propTypes = {
  filters: PropTypes.shape({
    command: PropTypes.string,
    severity: PropTypes.string
  }).isRequired,
  log: PropTypes.object
}

MessageList.defaultProps = {
  filters: {
    command: undefined,
    severity: undefined
  },
  log: undefined
}

MessageList.displayName = 'MessageList'

export default MessageList
