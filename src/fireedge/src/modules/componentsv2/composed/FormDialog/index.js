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

import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { Cancel } from 'iconoir-react'

import { T } from '@ConstantsModule'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { Dialog } from '@modules/componentsv2/primitives/Dialog'
import {
  DefaultFormStepper,
  SkeletonStepsForm,
} from '@modules/componentsv2/composed/Forms/FormStepper'
import {
  getBackdropStyles,
  getStyles,
} from '@modules/componentsv2/composed/FormDialog/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * Dialog that resolves and renders a v2 steps form.
 *
 * @param {object} root0 - Props
 * @param {*} root0.title - Dialog title
 * @param {Function} root0.onClose - Close handler
 * @param {Function} root0.onSubmit - Submit handler
 * @param {Function} root0.steps - Asynchronously loaded steps form
 * @param {object} root0.stepProps - Properties used to generate the steps
 * @param {object} root0.initialValues - Initial form values
 * @param {boolean} root0.update - Whether the form updates an existing resource
 * @returns {*} Form dialog
 */
export const FormDialog = ({
  title,
  onClose,
  onSubmit,
  steps: Steps,
  stepProps,
  initialValues,
  update = false,
  ...dialogProps
}) => {
  const { translateText } = useTranslation()

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={false}
      {...dialogProps}
      BackdropProps={{
        sx: getBackdropStyles(),
      }}
      PaperProps={{
        sx: (theme) => getStyles({ theme }),
      }}
    >
      <Box className="form-dialog-header">
        <Typography component="h2" className="form-dialog-title">
          {typeof title === 'string' ? translateText(title) : title}
        </Typography>
        <Button
          type="transparent"
          iconOnly={<Cancel />}
          onClick={onClose}
          aria-label={T.Close}
          title={T.Close}
        />
      </Box>
      <Steps
        initialValues={initialValues}
        stepProps={stepProps}
        onSubmit={onSubmit}
        fallback={<SkeletonStepsForm />}
      >
        {(config) => (
          <DefaultFormStepper
            {...config}
            onCancel={onClose}
            update={update}
            isPopup
          />
        )}
      </Steps>
    </Dialog>
  )
}

FormDialog.propTypes = {
  title: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  steps: PropTypes.elementType.isRequired,
  stepProps: PropTypes.object,
  initialValues: PropTypes.object,
  update: PropTypes.bool,
}

FormDialog.displayName = 'FormDialog'
