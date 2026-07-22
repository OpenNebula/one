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
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  ReactElement,
  isValidElement,
  useRef,
} from 'react'
import PropTypes from 'prop-types'
import { BaseSchema } from 'yup'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMediaQuery, Box, Stack } from '@mui/material'
import {
  useGeneral,
  updateDisabledSteps,
  useGeneralApi,
  useModalsApi,
} from '@FeaturesModule'
import { HelpCircle } from 'iconoir-react'
import SkeletonStepsForm from '@modules/componentsv2/composed/Forms/FormStepper/Default/skeleton'
import {
  groupBy,
  Step,
  StepsForm,
  isDevelopment,
  deepStringify,
} from '@UtilsModule'
import { T, STEP_STATUS } from '@ConstantsModule'
import get from 'lodash.get'
import { set, isEmpty } from 'lodash'
import { useSelector, useDispatch } from 'react-redux'

import { Stepper } from '@modules/componentsv2/primitives/Stepper'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { DocumentationDrawer } from '@modules/componentsv2/composed/DetailsDrawer/Documentation/Default'
import { SubmitButton } from '@modules/componentsv2/primitives/Buttons/Submit'

import { getStyles } from '@modules/componentsv2/composed/Forms/FormStepper/Default/styles'

import { useHistory } from 'react-router-dom'

const FIRST_STEP = 0

/**
 * Init the status of the steps.
 *
 * @param {object} params - Input parameters
 * @param {Step[]} params.steps - List of steps
 * @param {boolean} params.update - If it's update mode
 * @returns {object} Initial step statuses
 */
const getInitialStepStatuses = ({ steps = [], update = false }) =>
  steps.reduce((statuses, { id }, index) => {
    if (!id) return statuses

    return {
      ...statuses,
      [id]: update
        ? index === FIRST_STEP
          ? STEP_STATUS.REVIEWING
          : STEP_STATUS.COMPLETED
        : index === FIRST_STEP
        ? STEP_STATUS.IN_PROGRESS
        : STEP_STATUS.PENDING,
    }
  }, {})

/**
 * Default stepper form by configuration.
 *
 * @param {StepsForm} stepsForm - Steps form config
 * @returns {ReactElement} Stepper form component
 */
const DefaultFormStepper = ({
  onSubmit,
  onCancel,
  steps,
  defaultValues,
  resolver,
  initialValues,
  saveState = false,
  update = false,
  isPopup = false,
}) => {
  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolver()),
  })

  if (isDevelopment() && !isEmpty(methods?.formState?.errors)) {
    console.log('Validation Error(s): ', methods?.formState?.errors)
  }

  return (
    <FormProvider
      {...methods}
      initialValues={initialValues}
      getResolver={() => resolver(methods.watch())}
    >
      <FormStepper
        steps={steps}
        schema={resolver}
        onSubmit={onSubmit}
        onCancel={onCancel}
        saveState={saveState}
        update={update}
        isPopup={isPopup}
      />
    </FormProvider>
  )
}

DefaultFormStepper.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  steps: PropTypes.arrayOf(PropTypes.object),
  defaultValues: PropTypes.object,
  initialValues: PropTypes.object,
  resolver: PropTypes.func,
  saveState: PropTypes.bool,
  update: PropTypes.bool,
  isPopup: PropTypes.bool,
}

const DisableStepContext = createContext(() => {})
const ModifiedFieldsContext = createContext(() => () => {})

/**
 * Hook that can be used to enable/disable steps in the stepper dialog.
 *
 * @returns {Function} A function that is currently provided by the DisableStepContext.
 * The function takes a stepId or an array of stepIds and a condition to disable or enable the steps.
 * @example
 * const disableStep = useDisableStep();
 * disableStep('step1', true); // This will disable 'step1'
 */
export const useDisableStep = () => useContext(DisableStepContext)

/**
 * Hook to register a callback that persists modified fields before submitting.
 *
 * @returns {Function} Register function from the ModifiedFieldsContext.
 */
export const useRegisterModifiedFields = () => useContext(ModifiedFieldsContext)

/**
 * Represents a form with one or more steps.
 * Finally, it submit the result.
 *
 * @param {object} props - Props
 * @param {Step[]} props.steps - Steps
 * @param {function():BaseSchema} props.schema - Function to get form schema
 * @param {Function} props.onSubmit - Submit function
 * @param {Function} props.saveState - Use modifiedFields on Redux
 * @param {Function} props.onCancel - Cancel function
 * @param {boolean} props.update - Whether the form is used to update an existing resource
 * @param {boolean} props.isPopup - Whether the stepper is rendered in a popup
 * @returns {ReactElement} Stepper form component
 */
const FormStepper = ({
  steps: initialSteps = [],
  schema,
  onSubmit,
  onCancel,
  saveState = false,
  update = false,
  isPopup = false,
}) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))
  const {
    watch,
    reset,
    formState: { errors },
    setError,
    setFocus,
  } = useFormContext()
  const { setModifiedFields } = useGeneralApi()
  const { showModal } = useModalsApi()
  const history = useHistory()
  const { isLoading } = useGeneral()
  const [steps, setSteps] = useState(initialSteps)
  const [disabledSteps, setDisabledSteps] = useState({})
  const [openDocumentation, setOpenDocumentation] = useState(false)
  const dispatch = useDispatch()
  const currentState = useSelector((state) => state)
  const modifiedFieldsCallbacks = useRef(new Set())

  // State to control the status of each step. Object because idx could change when disable steps.
  const [stepStatuses, setStepStatuses] = useState(() =>
    getInitialStepStatuses({ steps: initialSteps, update })
  )

  // Change the status of a step
  const changeStepStatus = (stepIdx, status) => {
    const targetStepId = steps[stepIdx]?.id

    if (!targetStepId) return

    setStepStatuses((prev) => ({
      ...prev,
      [targetStepId]: status,
    }))
  }

  const executeCancel = useCallback(() => {
    if (typeof onCancel === 'function') {
      onCancel()

      return
    }

    history.goBack()
  }, [onCancel, history])

  // On cancel confirm progress loss before leaving the form
  const handleCancel = useCallback(() => {
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Cancel,
        description: T['form.cancel.progress.confirmation'],
        confirmLabel: T.Continue,
        cancelLabel: T.Cancel,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: executeCancel,
    })
  }, [executeCancel, showModal])

  // Used to control the default visibility of a step
  useEffect(() => {
    const newState = initialSteps.reduce(
      (accSteps, { id, defaultDisabled }) => {
        if (
          !defaultDisabled ||
          typeof defaultDisabled.condition !== 'function'
        ) {
          return { ...accSteps, [id]: false }
        }

        const result =
          Array.isArray(defaultDisabled.statePaths) &&
          defaultDisabled.statePaths.length > 0
            ? defaultDisabled.condition(
                ...defaultDisabled.statePaths.map((path) =>
                  get(currentState, path)
                )
              )
            : defaultDisabled.condition()

        return { ...accSteps, [id]: result }
      },
      {}
    )

    // Set the initial state of the steps accessible from redux
    dispatch(updateDisabledSteps(newState))
    setDisabledSteps(newState)
  }, [])

  const disableStep = useCallback((stepIds, shouldDisable) => {
    const ids = Array.isArray(stepIds) ? stepIds : [stepIds]

    setDisabledSteps((prev) => {
      let newDisabledSteps = { ...prev }

      ids.forEach((sId) => {
        newDisabledSteps = shouldDisable
          ? { ...newDisabledSteps, [sId]: true }
          : (({ [sId]: _, ...rest }) => rest)(newDisabledSteps)
      })

      return newDisabledSteps
    })
  }, [])

  const registerModifiedFields = useCallback((callback) => {
    if (typeof callback !== 'function') return () => {}

    modifiedFieldsCallbacks.current.add(callback)

    return () => {
      modifiedFieldsCallbacks.current.delete(callback)
    }
  }, [])

  const flushModifiedFields = useCallback(() => {
    modifiedFieldsCallbacks.current.forEach((callback) => callback())
  }, [])

  useEffect(() => {
    // filter out disabled steps
    const enabledSteps = initialSteps.filter((step) => !disabledSteps[step.id])
    setSteps(enabledSteps)
  }, [disabledSteps, initialSteps])

  const [formData, setFormData] = useState(() => watch())
  const [activeStep, setActiveStep] = useState(FIRST_STEP)

  const totalSteps = useMemo(() => steps?.length, [steps])
  const lastStep = useMemo(() => totalSteps - 1, [totalSteps])
  const disabledBack = useMemo(() => activeStep === FIRST_STEP, [activeStep])

  useEffect(() => {
    reset({ ...formData }, { keepErrors: false })
  }, [formData])

  const validateSchema = async (stepIdx) => {
    const { id, resolver, optionsValidate: options, ...step } = steps[stepIdx]
    const stepData = watch(id)

    const allData = { ...formData, [id]: stepData }
    const stepSchema =
      typeof resolver === 'function' ? resolver(allData) : resolver

    await stepSchema.validate(stepData, { context: allData, ...options })

    return { id, data: stepData, ...step }
  }

  const setErrors = ({ inner = [], message = { word: 'Error' } } = {}) => {
    const errorsByPath = groupBy(inner, 'path') ?? {}
    const jsonErrorsByPath = deepStringify(errorsByPath, 6) || ''
    const individualErrorMessages = [
      ...new Set(
        [message]
          .concat(inner.map((error) => error?.message ?? ''))
          .filter(Boolean)
      ),
    ]

    const extractedErrors = (jsonErrorsByPath.match(/\bmessage\b/g) || [])
      .length
    const individualErrors = individualErrorMessages?.length

    const totalErrors = extractedErrors || individualErrors || 0

    const translationError =
      totalErrors > 0 ? [T.ErrorsOcurred, totalErrors] : Object.values(message)

    setError(stepId, {
      type: 'manual',
      message: translationError,
      individualErrorMessages,
    })

    inner?.forEach(({ path, type, errors: innerMessage }) => {
      setError(`${stepId}.${path}`, { type, message: innerMessage })
    })

    const firstErrorPath = inner?.find((error) => error?.path)?.path

    if (firstErrorPath) {
      try {
        setFocus(`${stepId}.${firstErrorPath}`)
      } catch {}
    }
  }

  /**
   * Check if the save button can be displayed. That will happen when all the steps are completed except for the active one.
   *
   * @returns {boolean} True if the save button can be displayed
   */
  const canDisplaySave = () =>
    activeStep !== lastStep &&
    steps.every(
      ({ id }, stepIdx) =>
        stepIdx === activeStep || stepStatuses[id] === STEP_STATUS.COMPLETED
    )

  /**
   * Handle event when an user clicks in a step.
   *
   * @param {number} stepToAdvance - Id of the step
   */
  const handleStep = async (stepToAdvance) => {
    try {
      // Validate if the origin step is valid, if not, stop
      const { id, data } = await validateSchema(activeStep)

      // Mark origin step as completed
      changeStepStatus(activeStep, STEP_STATUS.COMPLETED)

      // Mark stepToAdvance as reviewing only when it was completed
      if (stepStatuses[steps[stepToAdvance]?.id] === STEP_STATUS.COMPLETED) {
        changeStepStatus(stepToAdvance, STEP_STATUS.REVIEWING)
      }

      // Update the form data with data from the origin step
      setFormData((prev) => ({ ...prev, [id]: data }))

      // Set new step as active
      setActiveStep(stepToAdvance)
    } catch (validateError) {
      // Mark origin step as error
      changeStepStatus(activeStep, STEP_STATUS.ERROR)

      // Set errors
      setErrors(validateError)
    }
  }

  const finishStepper = ({ id, data }) => {
    // Get all data from the form
    const submitData = { ...formData, [id]: data }
    const schemaData = schema().cast(submitData, {
      context: submitData,
      isSubmit: true,
    })

    // Iterate over steps to mark as delete in modifiedFields all the fields of a disabled step
    saveState &&
      Object.entries(disabledSteps).forEach(([stepName, stepState]) => {
        // Check that step is disabled
        if (stepState) {
          // Define the object with the fields to delete
          const fieldsToDelete = {}

          // If formData has field on this step, iterate over each one
          formData[stepName] &&
            Object.keys(formData[stepName]).forEach((fieldName) => {
              // Add delete mark
              set(fieldsToDelete, `${stepName}.${fieldName}`, {
                __delete__: true,
              })
            })

          // Update modifiedFields
          setModifiedFields(fieldsToDelete)
        }
      })

    // Execute onSubmit action
    onSubmit(schemaData)
  }

  /**
   * Handle event when an user clicks in next or finish button.
   */
  const handleNext = async () => {
    try {
      // Persist the active fields before final validation and schema casting.
      activeStep === lastStep && flushModifiedFields()

      // Update the form data with data from the active step
      const { id, data } = await validateSchema(activeStep)

      // Mark active step as completed
      changeStepStatus(activeStep, STEP_STATUS.COMPLETED)

      // Mark next step as in progress or reviewing if it was already completed
      if (activeStep !== lastStep) {
        const nextStep = activeStep + 1
        const nextStepStatus = stepStatuses[steps[nextStep]?.id]

        changeStepStatus(
          nextStep,
          nextStepStatus === STEP_STATUS.COMPLETED
            ? STEP_STATUS.REVIEWING
            : STEP_STATUS.IN_PROGRESS
        )
      }

      // Check if it's last step
      if (activeStep === lastStep) {
        // Call the handle save form
        finishStepper({ id, data })
      } else {
        // Not last step, update only step data in the form
        setFormData((prev) => ({ ...prev, [id]: data }))

        // Set the next step as active step
        setActiveStep((prevActiveStep) => prevActiveStep + 1)
      }
    } catch (validateError) {
      // Mark origin step as error
      changeStepStatus(activeStep, STEP_STATUS.ERROR)

      // Debug in the console
      console.error(validateError)

      // Set errors
      setErrors(validateError)
    }
  }

  /**
   * Handle event when an user clicks in back button.
   *
   * @param {number} stepToBack - Id of the step
   */
  const handleBack = useCallback(
    (stepToBack) => {
      // If active step it's the first, we cannot go back
      if (activeStep < FIRST_STEP) return

      // Get the id of the active step
      const { id } = steps[activeStep]

      // Get data of the step
      const stepData = watch(id)

      // Update the form with the data
      setFormData((prev) => ({ ...prev, [id]: stepData }))

      // Mark previous step as reviewing
      changeStepStatus(activeStep - 1, STEP_STATUS.REVIEWING)

      // Mark active step as completed
      lastStep !== activeStep &&
        changeStepStatus(activeStep, STEP_STATUS.COMPLETED)

      // Update the previous step as active step
      setActiveStep((prevStep) =>
        Number.isInteger(stepToBack) ? stepToBack : prevStep - 1
      )
    },
    [activeStep, steps]
  )

  /**
   * Handle event when an user clicks the save button. The save button is only displayed when all the steps are completed.
   */
  const handleSave = async () => {
    try {
      // Persist the active fields before validation and schema casting.
      flushModifiedFields()

      // Validate if the origin step is valid, if not, stop
      const { id, data } = await validateSchema(activeStep)

      // Finish the stepper
      finishStepper({ id, data })
    } catch (validateError) {
      // Mark origin step as error
      changeStepStatus(activeStep, STEP_STATUS.ERROR)

      // Set errors
      setErrors(validateError)
    }
  }

  const {
    id: stepId,
    content: Content,
    documentation: Documentation,
  } = useMemo(
    () => steps[activeStep] || { id: null, content: null, documentation: null },
    [steps, activeStep]
  )

  // TODO: Review mandatory only
  const valueShowMandatoryOnly = false

  const documentationProps =
    Documentation &&
    typeof Documentation === 'object' &&
    !Array.isArray(Documentation) &&
    !isValidElement(Documentation)
      ? Documentation
      : { content: Documentation }

  return (
    <DisableStepContext.Provider value={disableStep}>
      <ModifiedFieldsContext.Provider value={registerModifiedFields}>
        <Stack
          className="form-stepper-root"
          sx={(theme) => getStyles({ theme, isPopup })}
        >
          {/* STEPPER */}
          {useMemo(
            () => (
              <Stepper
                steps={steps}
                activeStep={activeStep}
                onClick={handleStep}
                stepStatuses={stepStatuses}
                errors={errors}
              />
            ),
            [
              isLoading,
              isMobile,
              activeStep,
              errors[stepId],
              steps,
              valueShowMandatoryOnly,
            ]
          )}
          {/* FORM CONTENT */}
          {Content && (
            <Box className="form-stepper-content">
              <Content
                data={formData[stepId]}
                setFormData={setFormData}
                showMandatoryOnly={valueShowMandatoryOnly}
              />
            </Box>
          )}
          <Box className="form-footer-buttons">
            {Documentation && (
              <Box className="form-help-buttons">
                <Button
                  data-cy="stepper-help-button"
                  onClick={() => setOpenDocumentation((isOpen) => !isOpen)}
                  type={'transparent'}
                  iconOnly={<HelpCircle />}
                />
              </Box>
            )}
            <Box className="form-stepper-buttons">
              <SubmitButton
                data-cy="stepper-cancel-button"
                label={T.Cancel}
                type={'transparent'}
                onClick={handleCancel}
              />
              <Box className="form-stepper-buttons-progress">
                {canDisplaySave() && (
                  <SubmitButton
                    data-cy="stepper-save-button"
                    label={T.Save}
                    type={'transparent'}
                    onClick={handleSave}
                  />
                )}
                <SubmitButton
                  data-cy="stepper-back-button"
                  isDisabled={disabledBack || isLoading}
                  type={'secondary'}
                  onClick={handleBack}
                  label={T.Back}
                />
                <SubmitButton
                  data-cy="stepper-next-button"
                  isSubmitting={isLoading}
                  onClick={handleNext}
                  label={activeStep === lastStep ? T.Finish : T.Next}
                />
              </Box>
            </Box>
          </Box>
        </Stack>
      </ModifiedFieldsContext.Provider>
      <DocumentationDrawer
        isOpen={openDocumentation}
        onClose={() => setOpenDocumentation(false)}
        {...documentationProps}
      />
    </DisableStepContext.Provider>
  )
}

FormStepper.propTypes = {
  steps: PropTypes.array,
  schema: PropTypes.func,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  saveState: PropTypes.bool,
  update: PropTypes.bool,
  isPopup: PropTypes.bool,
}

export { DefaultFormStepper, SkeletonStepsForm, FormStepper }
