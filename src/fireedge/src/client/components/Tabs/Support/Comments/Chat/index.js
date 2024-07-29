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
import { ReactElement, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Avatar,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Grid,
} from '@mui/material'

import {
  Attachment as ClipIcon,
  Page as FileIcon,
  NavArrowDown as ExpandMoreIcon,
  NavArrowUp as ExpandLessIcon,
} from 'iconoir-react'

import { Tr } from 'client/components/HOC'
import { T, Ticket, Attachment, TicketComment } from 'client/constants'

import {
  isoDateToMilliseconds,
  timeFromMilliseconds,
} from 'client/models/Helper'
import Timer from 'client/components/Timer'

import { useStyles } from 'client/components/Tabs/Support/Comments/Chat/styles'
import clsx from 'clsx'
import { useSupportAuth } from 'client/features/SupportAuth'
import { prettyBytes } from 'client/utils'

/**
 * Renders the whole attachment list.
 *
 * @param {object} props - Props
 * @param {Attachment[]} props.attachments - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const AttachmentList = ({ attachments }) => {
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    setOpen(!open)
  }
  const classes = useStyles()

  return (
    <List sx={{ width: '100%' }} component="div">
      <ListItemButton onClick={handleClick}>
        <ClipIcon className={classes.icon} />
        <ListItemText primary={Tr(T.Attachments)} />
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {attachments.map((attachment) => (
            <AttachmentItem key={attachment.filename} attachment={attachment} />
          ))}
        </List>
      </Collapse>
    </List>
  )
}

AttachmentList.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.shape({})),
}

AttachmentList.displayName = 'AttachmentList'

/**
 * Renders one attachment.
 *
 * @param {object} props - Props
 * @param {Attachment} props.attachment - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const AttachmentItem = ({ attachment = {} }) => {
  const classes = useStyles()

  const downloadFile = (fileUrl) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <ListItemButton sx={{ pl: 4 }} onClick={() => downloadFile(attachment.url)}>
      <FileIcon className={classes.icon} />
      <ListItemText
        primary={`${attachment.filename} (${prettyBytes(
          attachment.size,
          'B'
        )})`}
      />
    </ListItemButton>
  )
}

AttachmentItem.propTypes = {
  attachment: PropTypes.shape({}),
}

AttachmentItem.displayName = 'AttachmentItem'

/**
 * Message bubble to show ticket messages.
 *
 * @param {object} props - Props
 * @param {TicketComment} props.comment -
 * @returns {ReactElement} Message bubble
 */
const BubbleMessage = ({ comment = {} }) => {
  if (!comment) return null

  const { attachments, author, body, createdAt } = comment
  const { user } = useSupportAuth()
  const classes = useStyles()

  const [time, timeFormat] = useMemo(() => {
    const fromMill = timeFromMilliseconds(isoDateToMilliseconds(createdAt))

    return [fromMill, fromMill.toFormat('ff')]
  }, [createdAt])

  return (
    <div
      className={clsx(
        classes.bubble,
        author.id === user.id
          ? classes.requesterMessage
          : classes.supportMessage
      )}
    >
      <div className={classes.messageAuthor}>
        {author.photo ? (
          <Avatar className={classes.authorImage} src={author.photo} />
        ) : (
          <Avatar className={classes.authorImage} />
        )}

        <span>{`${author.name}`}</span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: body }}></div>
      {attachments.length > 0 && <AttachmentList attachments={attachments} />}
      <div className={classes.messageDate}>
        <span title={timeFormat}>
          <Timer initial={time} />
        </span>
      </div>
    </div>
  )
}

BubbleMessage.propTypes = {
  comment: PropTypes.shape({}),
}

BubbleMessage.displayName = 'BubbleMessage'

/**
 * Renders mainly comments tab.
 *
 * @param {object} props - Props
 * @param {Ticket} props.comments - Support ticket
 * @returns {ReactElement} Comments tab
 */
const ChatPanel = ({ comments = [] }) => {
  const classes = useStyles()

  return (
    <Grid container spacing={1}>
      <Grid item className={classes.chatBox}>
        {comments.map((comment) => (
          <BubbleMessage key={comment.id} comment={comment} />
        ))}
      </Grid>
    </Grid>
  )
}

ChatPanel.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.shape({})),
}

ChatPanel.displayName = 'ChatPanel'

export default ChatPanel
