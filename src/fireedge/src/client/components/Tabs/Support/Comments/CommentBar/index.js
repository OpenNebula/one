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

import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { T, Ticket } from 'client/constants'

import { SubmitButton } from 'client/components/FormControl'

import { yupResolver } from '@hookform/resolvers/yup'
import { Box, Stack } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Translate } from 'client/components/HOC'
import * as FORM from 'client/components/Tabs/Support/Comments/CommentBar/schema'
import { useUpdateTicketMutation } from 'client/features/OneApi/support'
import { useSupportAuth } from 'client/features/SupportAuth'
import { sanitize } from 'client/utils'
import { DateTime } from 'luxon'
import { marked } from 'marked'

/**
 * Component to handle new comments.
 *
 * @param {object} props - Props
 * @param {Ticket} props.ticket - Support ticket
 * @param {Array} props.comments - comments
 * @param {Function} props.setComments - set comments
 * @returns {ReactElement} Comments tab
 */
const CommentBar = ({
  ticket = undefined,
  comments = [],
  setComments = () => undefined,
}) => {
  if (!ticket) return null

  const { user: userState } = useSupportAuth()
  const [update, updateState] = useUpdateTicketMutation()
  const isLoading = updateState.isLoading

  const { handleSubmit, setError, reset, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: FORM.SCHEMA.default(),
    resolver: yupResolver(FORM.SCHEMA),
  })

  const onSubmit = (fields) => {
    const commentBody = {
      id: ticket.id,
      body: marked.parse(sanitize`${fields.BODY}`),
      // attachments: fields.ATTACHMENTS,
    }
    fields.solved && (commentBody.solved = true)
    update(commentBody)
    setComments([
      ...comments,
      {
        ...commentBody,
        createdAt: DateTime.now().toISO(),
        attachments: [],
        author: {
          id: userState.id,
          name: userState.name,
          photo: userState.photo,
        },
      },
    ])
    reset()
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      width="100%"
      flexDirection="column"
      flexShrink={0}
      justifyContent={{ sm: 'center' }}
      sx={{ opacity: 1 }}
    >
      <FormProvider {...methods}>
        <FormWithSchema cy="post-comment" fields={FORM.FIELDS} />
      </FormProvider>
      <Stack direction="row-reverse" gap={1} my={2}>
        <SubmitButton
          color="secondary"
          data-cy="add-comment-button"
          isSubmitting={isLoading}
          sx={{ textTransform: 'uppercase' }}
          label={<Translate word={T.Submit} />}
        />
      </Stack>
    </Box>
  )
}

CommentBar.propTypes = {
  comments: PropTypes.array,
  ticket: PropTypes.shape({}),
  setComments: PropTypes.func,
}

CommentBar.displayName = 'CommentBar'

export default CommentBar
