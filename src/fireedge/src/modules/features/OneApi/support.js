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
import { http } from '@UtilsModule'
import {
  Actions as ActionsSupport,
  Commands as CommandsSupport,
} from 'server/routes/api/support/routes'
import { Actions, Commands } from 'server/routes/api/zendesk/routes'

import { TicketComment } from '@ConstantsModule'
import { oneApi } from '@modules/features/OneApi/oneApi'
import { ONE_RESOURCES_POOL } from '@modules/features/OneApi/resources'
const { SUPPORT_POOL } = ONE_RESOURCES_POOL

const authSupportApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query({
      /**
       * Retrieves information for all or part of
       * the tickets on support portal.
       *
       * @returns {object[]} List of support tickets
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.ZENDESK_LIST
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => {
        const tickets = data?.tickets ?? []
        // Sort the tickets by ID
        tickets.sort((a, b) => b.id - a.id)

        return tickets.flat()
      },
      providesTags: (tickets) =>
        tickets
          ? [
              ...tickets.map(({ ID }) => ({
                type: SUPPORT_POOL,
                id: `${ID}`,
              })),
              SUPPORT_POOL,
            ]
          : [SUPPORT_POOL],
    }),
    getTicketComments: builder.query({
      /**
       * Retrieves information for all or part of
       * the tickets on Zendesk.
       *
       * @param {object} params -
       * @param {number} params.id - Support ticket id
       * @returns {TicketComment[]} Support ticket comments
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ZENDESK_COMMENT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (resp) => {
        const { comments, users } = resp[0]

        return comments.map((comment) => {
          const author = users.find((user) => user.id === comment.author_id)

          return {
            id: comment.id,
            createdAt: comment.created_at,
            body: comment.html_body,
            attachments: comment.attachments.map((attachment) => ({
              filename: attachment.file_name,
              url: attachment.content_url,
              size: attachment.size,
            })),
            author: {
              id: author.id,
              name: author.name,
              photo: author.photo?.content_url,
            },
          }
        })
      },
    }),
    loginSupport: builder.mutation({
      /**
       * Login in the support portal.
       *
       * @param {object} params - User credentials
       * @param {string} params.user - User email
       * @param {string} params.pass - Password
       * @returns {object} Response data from request
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ZENDESK_LOGIN
        const command = { name, ...Commands[name] }

        return { params, command, needState: true }
      },
      transformResponse: (response) => {
        if (!response.id) return { user: undefined }

        return {
          user: {
            id: response.id,
            name: response.name,
            email: response.email,
            token: response.authenticity_token,
            photo: response.photo?.content_url,
          },
        }
      },
    }),
    getTicket: builder.mutation({
      /**
       * Retrieve support ticket information.
       *
       * @param {string} id - Support ticket id
       * @param {object} configBaseQueryApi - ConfigBaseQueryApi
       * @param {function():object} configBaseQueryApi.getState - Get current state
       * @returns {object} Support ticket data
       * @throws Fails when response isn't code 200
       */
      queryFn: (id, { getState }) => {
        try {
          const data = getState()?.oneApi?.queries?.[
            'getTickets(undefined)'
          ]?.data?.find((ticket) => ticket.id.toString() === id)

          return { data }
        } catch (error) {
          return { error }
        }
      },
    }),
    updateTicket: builder.mutation({
      /**
       * Send message on a support portal ticket.
       *
       * @param {object} params - Comment information
       * @param {string} params.id - Ticket ID
       * @param {string} params.body - Message to post
       * @param {boolean} params.solved - Is solved
       * @param {string} params.attachments - Password
       * @returns {object} Response data from request
       * @throws Fails when response isn't code 200
       */
      queryFn: async (params) => {
        const { attachments, id, body, solved } = params
        try {
          const data = new FormData()
          attachments && data.append('attachments', attachments)
          solved && data.append('solved', solved)
          data.append('body', body)

          const response = await http.request({
            url: `/api/zendesk/${id}`,
            method: 'PUT',
            data,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })

          return { data: response.data }
        } catch (axiosError) {
          const { response } = axiosError

          return { error: { status: response?.status, data: response?.data } }
        }
      },
      invalidatesTags: (_, __, { id }) => [{ type: SUPPORT_POOL, id }],
    }),
    createTicket: builder.mutation({
      /**
       * Create a new support portal ticket.
       *
       * @param {object} params - Comment information
       * @param {string} params.subject - Ticket Subject
       * @param {string} params.body - Message to post
       * @param {boolean} params.version - OpenNebula Version
       * @param {string} params.severity - Ticket severity
       * @returns {object} Response data from request
       * @throws Fails when response isn't code 200
       */
      queryFn: async (params) => {
        const { attachments, subject, body, version, severity } = params
        try {
          const data = new FormData()
          data.append('subject', subject)
          data.append('body', body)
          data.append('version', version)
          data.append('severity', severity)
          attachments && data.append('attachments', attachments)

          const response = await http.request({
            url: `/api/zendesk`,
            method: 'POST',
            data,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })

          return { data: response.data }
        } catch (axiosError) {
          const { response } = axiosError

          return { error: { status: response?.status, data: response?.data } }
        }
      },
      invalidatesTags: [SUPPORT_POOL],
    }),
    checkOfficialSupport: builder.query({
      /**
       * Valid if it is held by a Support enterprise token.
       *
       * @returns {string} List of support tickets
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = ActionsSupport.SUPPORT_CHECK
        const command = { name, ...CommandsSupport[name] }
        const showNotification = false

        return { command, showNotification }
      },
      transformResponse: (data) => data,
    }),
  }),
})

const supportQueries = (({
  // Queries
  useGetTicketsQuery,
  useLazyGetTicketsQuery,
  useGetTicketCommentsQuery,
  useLazyGetTicketCommentsQuery,
  useCheckOfficialSupportQuery,
  useLazyCheckOfficialSupportQuery,

  // Mutations
  useLoginSupportMutation,
  useGetTicketMutation,
  useUpdateTicketMutation,
  useCreateTicketMutation,
}) => ({
  // Queries
  useGetTicketsQuery,
  useLazyGetTicketsQuery,
  useGetTicketCommentsQuery,
  useLazyGetTicketCommentsQuery,
  useCheckOfficialSupportQuery,
  useLazyCheckOfficialSupportQuery,

  // Mutations
  useLoginSupportMutation,
  useGetTicketMutation,
  useUpdateTicketMutation,
  useCreateTicketMutation,
}))(authSupportApi)

export default supportQueries
