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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback, useState } from 'react'
import { DialogForm } from '@modules/resources/Dialogs'
import {
  AlertDialog,
  FormDialog,
  FormStepper,
  FormWithSchema,
} from '@ComponentsV2Module'
import { useModals, useModalsApi } from '@FeaturesModule'
import PropTypes from 'prop-types'

const ModalWrapper = ({ modal, hideModal }) => {
  const {
    id,
    isConfirmDialog = false,
    isCustomDialog = false,
    isFormDialog = false,
    customDialogProps = {},
    dialogProps = {},
    form: Form,
    onSubmit: handleSubmit = () => {},
    onCancel: handleCancel,
  } = modal

  const [isLoading, setIsLoading] = useState(false)

  const hide = useCallback(() => {
    hideModal(id)
  }, [hideModal, id])

  const cancel = useCallback(() => {
    handleCancel?.()
    hide()
  }, [handleCancel, hide])

  const handleTriggerSubmit = useCallback(
    async (formData) => {
      let shouldHide = true

      try {
        setIsLoading(true)
        shouldHide = (await handleSubmit(formData)) !== false
      } catch (err) {
        console.log(err)
      } finally {
        setIsLoading(false)
        shouldHide && hide()
      }
    },
    [handleSubmit, hide]
  )

  if (isConfirmDialog) {
    const {
      title,
      description,
      subheader,
      confirmLabel,
      cancelLabel,
      ...alertDialogProps
    } = dialogProps // TODO: Rename all occurances of subheader to description

    return (
      <AlertDialog
        {...alertDialogProps}
        title={title}
        onSubmit={handleTriggerSubmit}
        onCancel={cancel}
        isConfirmDisabled={isLoading}
        isCancelDisabled={isLoading}
        description={description || subheader}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
      />
    )
  }

  if (isFormDialog) {
    return (
      <FormDialog
        {...dialogProps}
        onClose={cancel}
        onSubmit={handleTriggerSubmit}
      />
    )
  }

  if (isCustomDialog && Form) {
    return (
      <Form
        {...dialogProps}
        {...customDialogProps}
        open
        onClose={cancel}
        onSubmit={handleTriggerSubmit}
        isLoading={isLoading}
      />
    )
  }

  if (!Form) {
    return null
  }

  return (
    <Form key={id} onSubmit={handleTriggerSubmit}>
      {({
        steps,
        defaultValues,
        resolver,
        description,
        fields,
        ContentForm,
        onSubmit,
        saveState,
      }) =>
        resolver && (
          <DialogForm
            resolver={resolver}
            values={defaultValues}
            handleSubmit={!steps ? onSubmit : undefined}
            handleCancel={cancel}
            dialogProps={{ ...dialogProps }}
          >
            {steps ? (
              <FormStepper
                steps={steps}
                schema={resolver}
                onSubmit={onSubmit}
                onCancel={hide}
                saveState={saveState}
              />
            ) : ContentForm ? (
              <ContentForm />
            ) : (
              <>
                {dialogProps?.description ?? description}
                <FormWithSchema cy="form-dg" fields={fields} />
              </>
            )}
          </DialogForm>
        )
      }
    </Form>
  )
}

ModalWrapper.propTypes = {
  hideModal: PropTypes.func.isRequired,
  modal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    isConfirmDialog: PropTypes.bool,
    isCustomDialog: PropTypes.bool,
    isFormDialog: PropTypes.bool,
    customDialogProps: PropTypes.object,
    dialogProps: PropTypes.object,
    form: PropTypes.elementType,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
  }).isRequired,
}

const ModalsHost = () => {
  const { modals } = useModals()
  const { hideModal } = useModalsApi()

  return (
    <>
      {modals.map((modal) => (
        <ModalWrapper key={modal.id} modal={modal} hideModal={hideModal} />
      ))}
    </>
  )
}

export default ModalsHost
