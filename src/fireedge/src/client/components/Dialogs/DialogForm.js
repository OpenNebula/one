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
import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@material-ui/core'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers'

import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const DialogForm = memo(
  ({
    open,
    title,
    values,
    resolver,
    onSubmit,
    onCancel,
    submitButtonProps,
    children
  }) => {
    const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

    const methods = useForm({
      mode: 'onBlur',
      reValidateMode: 'onSubmit',
      defaultValues: values,
      resolver: yupResolver(resolver())
    })

    return (
      <Dialog
        fullScreen={isMobile}
        open={open}
        maxWidth="lg"
        scroll="paper"
        PaperProps={{
          style: {
            height: isMobile ? '100%' : '80%',
            width: isMobile ? '100%' : '80%'
          }
        }}
      >
        <DialogTitle>{Tr(title)}</DialogTitle>
        <DialogContent dividers>
          <FormProvider {...methods}>{children}</FormProvider>
        </DialogContent>
        {(onCancel || onSubmit) && (
          <DialogActions>
            {onCancel && (
              <Button onClick={onCancel}>
                {Tr(T.Cancel)}
              </Button>
            )}
            {onSubmit && (
              <SubmitButton
                color='secondary'
                data-cy="dg-form-submit-button"
                isSubmitting={methods.formState.isSubmitting}
                onClick={methods.handleSubmit(onSubmit)}
                label={Tr(T.Save)}
                {...submitButtonProps}
              />
            )}
          </DialogActions>
        )}
      </Dialog>
    )
  }
)

DialogForm.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.any),
    PropTypes.objectOf(PropTypes.any)
  ]),
  resolver: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  submitButtonProps: PropTypes.objectOf(PropTypes.any),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
}

DialogForm.defaultProps = {
  open: true,
  title: 'Title dialog form',
  values: {},
  resolver: {},
  onSubmit: undefined,
  onCancel: undefined,
  submitButtonProps: undefined,
  children: null
}

export default DialogForm
