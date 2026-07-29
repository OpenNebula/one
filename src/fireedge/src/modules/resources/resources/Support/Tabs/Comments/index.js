/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { yupResolver } from '@hookform/resolvers/yup'
import { Attachment as AttachmentIcon, Page as FileIcon } from 'iconoir-react'
import { Avatar, Box } from '@mui/material'
import { Component, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { marked } from 'marked'
import PropTypes from 'prop-types'

import { Button, FormWithSchema, SubmitButton, Text } from '@ComponentsV2Module'
import { STYLE_BUTTONS, T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { useGeneralApi, useSupportAuth } from '@FeaturesModule'
import {
  isoDateToMilliseconds,
  prettyBytes,
  sanitize,
  timeFromMilliseconds,
} from '@UtilsModule'

import * as FORM from '@modules/resources/resources/Support/Tabs/Comments/schema'
import { getStyles } from '@modules/resources/resources/Support/Tabs/Comments/styles'

const COMMENT_FIELDS = [FORM.BODY, FORM.SOLVED]
const MAX_ATTACHMENT_SIZE = 50 * 1024 ** 2

const getCommentDate = (createdAt) =>
  createdAt
    ? timeFromMilliseconds(isoDateToMilliseconds(createdAt)).toRelative()
    : '-'

const getCommentTimestamp = (comment = {}) =>
  comment?.createdAt ? isoDateToMilliseconds(comment.createdAt) : 0

const getFileName = (file) => {
  const selectedFile = Array.isArray(file) ? file[0] : file

  return (
    selectedFile?.name ??
    selectedFile?.filename ??
    selectedFile?.file_name ??
    selectedFile?.fileName
  )
}

const downloadFile = (fileUrl) => {
  const link = document.createElement('a')
  link.href = fileUrl
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const AttachmentList = ({ attachments = [] }) =>
  attachments.length > 0 ? (
    <Box className="attachments">
      <Box className="attachments-title">
        <AttachmentIcon width="16px" height="16px" />
        <Text
          value={T.Attachments}
          variant={TEXT_VARIANTS.BODY_SMALL}
          weight={TEXT_WEIGHTS.SEMIBOLD}
        />
      </Box>
      <Box className="attachments-list">
        {attachments.map((attachment) => (
          <Button
            key={attachment.url ?? attachment.filename}
            type={STYLE_BUTTONS.TYPE.TRANSPARENT}
            size="small"
            startIcon={<FileIcon width="16px" height="16px" />}
            onClick={() => downloadFile(attachment.url)}
            title={`${attachment.filename} (${prettyBytes(
              attachment.size,
              'B'
            )})`}
          />
        ))}
      </Box>
    </Box>
  ) : null

AttachmentList.propTypes = {
  attachments: PropTypes.array,
}

const BubbleMessage = ({ comment = {} }) => {
  const { user } = useSupportAuth()
  const { attachments = [], author = {}, body, createdAt } = comment
  const isRequester = String(author.id) === String(user?.id)
  const createdLabel = useMemo(() => getCommentDate(createdAt), [createdAt])

  return (
    <Box
      className={`comment-bubble${
        isRequester ? ' comment-bubble--requester' : ''
      }`}
    >
      <Box className="comment-author">
        <Avatar className="comment-author-avatar" src={author.photo} />
        <Text
          value={author.name ?? '-'}
          variant={TEXT_VARIANTS.BODY_SMALL}
          weight={TEXT_WEIGHTS.SEMIBOLD}
        />
      </Box>
      <Box
        className="comment-body"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <AttachmentList attachments={attachments} />
      <Text
        className="comment-date"
        value={createdLabel}
        variant={TEXT_VARIANTS.CAPTION}
      />
    </Box>
  )
}

BubbleMessage.propTypes = {
  comment: PropTypes.object,
}

const CommentBar = ({
  ticket = {},
  onSubmitComment,
  isSubmittingComment = false,
}) => {
  const { enqueueSuccess } = useGeneralApi()
  const uploadInputRef = useRef()
  const [uploadedFileName, setUploadedFileName] = useState()
  const methods = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: FORM.SCHEMA.default(),
    resolver: yupResolver(FORM.SCHEMA),
  })
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
    setValue,
  } = methods
  const attachmentError = errors?.[FORM.ATTACHMENTS.name]?.message

  const onSubmit = async (fields) => {
    const commentBody = {
      id: ticket.id,
      body: marked.parse(sanitize`${fields.BODY}`),
      attachments: fields.ATTACHMENTS,
    }

    fields.SOLVED && (commentBody.solved = true)

    await onSubmitComment?.(commentBody)
    enqueueSuccess(T.SuccessSupportCommentSent)
    reset()
    setUploadedFileName(undefined)
  }

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setValue(FORM.ATTACHMENTS.name, undefined, {
        shouldDirty: true,
        shouldValidate: false,
      })
      setUploadedFileName(undefined)
      setError(FORM.ATTACHMENTS.name, {
        type: 'manual',
        message: T.FileTooLarge,
      })
      event.target.value = ''

      return
    }

    clearErrors(FORM.ATTACHMENTS.name)
    setValue(FORM.ATTACHMENTS.name, file, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setUploadedFileName(getFileName(file))
    enqueueSuccess(T.SuccessSupportAttachmentUploaded)
    event.target.value = ''
  }

  return (
    <Box
      component="form"
      className="comment-form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormProvider {...methods}>
        <FormWithSchema cy="post-comment" fields={COMMENT_FIELDS} />
        <Box className="comment-actions">
          <Box className="comment-upload">
            <Box
              ref={uploadInputRef}
              component="input"
              className="comment-upload-input"
              type="file"
              onChange={handleAttachmentChange}
            />
            <Button
              htmlType="button"
              type={STYLE_BUTTONS.TYPE.PRIMARY}
              size="small"
              startIcon={<FileIcon width="16px" height="16px" />}
              onClick={() => uploadInputRef.current?.click()}
              title={T.Upload}
            />
            {uploadedFileName && (
              <Box className="comment-upload-filename" title={uploadedFileName}>
                {uploadedFileName}
              </Box>
            )}
            {attachmentError && (
              <Text
                className="comment-upload-error"
                value={attachmentError}
                variant={TEXT_VARIANTS.CAPTION}
              />
            )}
          </Box>
          <Box className="comment-submit">
            <SubmitButton
              data-cy="add-comment-button"
              isSubmitting={isSubmittingComment}
              label={T.Submit}
              type={STYLE_BUTTONS.TYPE.PRIMARY}
            />
          </Box>
        </Box>
      </FormProvider>
    </Box>
  )
}

CommentBar.propTypes = {
  isSubmittingComment: PropTypes.bool,
  onSubmitComment: PropTypes.func,
  ticket: PropTypes.object,
}

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Support comments tab
 */
export const Comments = ({ data, config }) => {
  const {
    selected: ticket = {},
    comments = [],
    onSubmitComment,
    isSubmittingComment,
  } = data || {}
  const isCommentsEnabled = config?.enabled !== false
  const canComment = config?.actions?.comment === true
  const commentList = useMemo(
    () =>
      (Array.isArray(comments) ? [...comments] : []).sort(
        (commentA, commentB) =>
          getCommentTimestamp(commentA) - getCommentTimestamp(commentB)
      ),
    [comments]
  )

  if (!isCommentsEnabled) return null

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      {canComment && (
        <CommentBar
          ticket={ticket}
          onSubmitComment={onSubmitComment}
          isSubmittingComment={isSubmittingComment}
        />
      )}
      <Box className="comments-list">
        {commentList.map((comment) => (
          <BubbleMessage key={comment.id} comment={comment} />
        ))}
      </Box>
    </Box>
  )
}

Comments.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Comments.id = 'comments'
Comments.title = T.Comments
