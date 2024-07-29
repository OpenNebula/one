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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useEffect, useState } from 'react'

import Chat from 'client/components/Tabs/Support/Comments/Chat'
import CommentBar from 'client/components/Tabs/Support/Comments/CommentBar'

import {
  useGetTicketMutation,
  useLazyGetTicketCommentsQuery,
} from 'client/features/OneApi/support'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string} props.id - Support ticket ID
 * @returns {ReactElement} Information tab
 */
const SupportTicketChatTab = ({ tabProps = {}, id }) => {
  const { actions: chatPanelActions } = tabProps
  const [getTicket, { data = undefined }] = useGetTicketMutation()
  const [getComments, { data: commentsData = [] }] =
    useLazyGetTicketCommentsQuery()
  const [comments, setComments] = useState(commentsData)

  useEffect(async () => {
    getTicket(id)
    const commentsTicket = await getComments({ id })
    commentsTicket?.data && setComments(commentsTicket.data)
  }, [id])

  return (
    <>
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <Chat comments={comments} />
      </Stack>
      {chatPanelActions?.comment && (
        <Stack>
          <CommentBar
            ticket={data}
            comments={comments}
            setComments={setComments}
          />
        </Stack>
      )}
    </>
  )
}

SupportTicketChatTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

SupportTicketChatTab.displayName = 'SupportTicketChatTab'

export default SupportTicketChatTab
