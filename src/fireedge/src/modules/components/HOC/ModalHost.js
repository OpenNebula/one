/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback } from 'react'
import { DialogConfirmation, DialogForm } from '@modules/components/Dialogs'
import FormStepper from '@modules/components/FormStepper'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { useModals, useModalsApi } from '@FeaturesModule'
import PropTypes from 'prop-types'

const ModalWrapper = ({ modal, hideModal }) => {
  const {
    id,
    isConfirmDialog = false,
    dialogProps = {},
    form: Form,
    onSubmit: handleSubmit = () => {},
  } = modal

  const hide = useCallback(() => {
    hideModal(id)
  }, [hideModal, id])

  const handleTriggerSubmit = useCallback(
    async (formData) => {
      try {
        await handleSubmit(formData)
      } catch (err) {
      } finally {
        hide()
      }
    },
    [handleSubmit, hide]
  )

  if (isConfirmDialog) {
    return (
      <DialogConfirmation
        key={id}
        handleAccept={handleTriggerSubmit}
        handleCancel={hide}
        {...dialogProps}
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
            dialogProps={{ handleCancel: hide, ...dialogProps }}
          >
            {steps ? (
              <FormStepper
                steps={steps}
                schema={resolver}
                onSubmit={onSubmit}
                saveState={saveState}
              />
            ) : ContentForm ? (
              <ContentForm />
            ) : (
              <>
                {description}
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
    dialogProps: PropTypes.object,
    form: PropTypes.elementType,
    onSubmit: PropTypes.func,
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
