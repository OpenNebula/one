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
import { useEffect } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { Backdrop, CircularProgress } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { useFetch } from 'client/hooks'
import { DialogConfirmation } from 'client/components/Dialogs'

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: theme.palette.common.white,
  },
  withTabs: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
}))

const DialogRequest = ({ withTabs, request, dialogProps, children }) => {
  const classes = useStyles()
  const fetchProps = useFetch(request)
  const { data, fetchRequest, loading, error } = fetchProps

  useEffect(() => {
    fetchRequest()
  }, [])

  error && dialogProps?.handleCancel()

  if (!data || loading) {
    return (
      <Backdrop open className={classes.backdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  if (withTabs) {
    const { className, ...contentProps } = dialogProps.contentProps ?? {}

    dialogProps.contentProps = {
      className: clsx(classes.withTabs, className),
      ...contentProps,
    }
  }

  return (
    <DialogConfirmation {...dialogProps}>
      {children?.({ fetchProps })}
    </DialogConfirmation>
  )
}

DialogRequest.propTypes = {
  withTabs: PropTypes.bool,
  request: PropTypes.func.isRequired,
  dialogProps: PropTypes.shape({
    title: PropTypes.string.isRequired,
    contentProps: PropTypes.objectOf(PropTypes.any),
    handleAccept: PropTypes.func,
    acceptButtonProps: PropTypes.objectOf(PropTypes.any),
    handleCancel: PropTypes.func,
    cancelButtonProps: PropTypes.objectOf(PropTypes.any),
    handleEntering: PropTypes.func,
  }),
  children: PropTypes.func,
}

DialogRequest.defaultProps = {
  withTabs: false,
  request: () => undefined,
  dialogProps: {
    title: undefined,
    contentProps: {},
    handleAccept: undefined,
    acceptButtonProps: undefined,
    handleCancel: undefined,
    cancelButtonProps: undefined,
    handleEntering: undefined,
  },
  children: () => undefined,
}

DialogRequest.displayName = 'DialogRequest'

export default DialogRequest
