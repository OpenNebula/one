/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useState, useMemo, useCallback, useEffect, ReactElement } from 'react'
import PropTypes from 'prop-types'

import { BaseSchema } from 'yup'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMediaQuery } from '@mui/material'

import { useGeneral } from 'client/features/General'
import CustomMobileStepper from 'client/components/FormStepper/MobileStepper'
import CustomStepper from 'client/components/FormStepper/Stepper'
import SkeletonStepsForm from 'client/components/FormStepper/Skeleton'
import { groupBy, Step, StepsForm } from 'client/utils'
import { T } from 'client/constants'

const FIRST_STEP = 0

/**
 * Default stepper form by configuration.
 *
 * @param {StepsForm} stepsForm - Steps form config
 * @returns {ReactElement} Stepper form component
 */
const DefaultFormStepper = ({
  onSubmit,
  steps,
  defaultValues,
  resolver,
  initialValues,
}) => {
  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolver()),
  })

  return (
    <FormProvider {...methods} initialValues={initialValues}>
      <FormStepper steps={steps} schema={resolver} onSubmit={onSubmit} />
    </FormProvider>
  )
}

DefaultFormStepper.propTypes = {
  onSubmit: PropTypes.func,
  steps: PropTypes.arrayOf(PropTypes.object),
  defaultValues: PropTypes.object,
  initialValues: PropTypes.object,
  resolver: PropTypes.func,
}

/**
 * Represents a form with one or more steps.
 * Finally, it submit the result.
 *
 * @param {object} props - Props
 * @param {Step[]} props.steps - Steps
 * @param {function():BaseSchema} props.schema - Function to get form schema
 * @param {Function} props.onSubmit - Submit function
 * @returns {ReactElement} Stepper form component
 */
const FormStepper = ({ steps = [], schema, onSubmit }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.only('xs'))
  const {
    watch,
    reset,
    formState: { errors },
    setError,
  } = useFormContext()
  const { isLoading } = useGeneral()

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
    const totalErrors = Object.keys(errorsByPath).length

    const translationError =
      totalErrors > 0 ? [T.ErrorsOcurred, totalErrors] : Object.values(message)

    setError(stepId, { type: 'manual', message: translationError })

    inner?.forEach(({ path, type, errors: innerMessage }) => {
      setError(`${stepId}.${path}`, { type, message: innerMessage })
    })
  }

  const handleStep = (stepToAdvance) => {
    const isBackAction = activeStep > stepToAdvance

    isBackAction && handleBack(stepToAdvance)

    const stepsForward = steps.slice(FIRST_STEP, stepToAdvance)

    stepsForward.forEach(async (_, stepIdx, stepsToValidate) => {
      try {
        const { id, data } = await validateSchema(stepIdx)

        activeStep === stepIdx &&
          setFormData((prev) => ({ ...prev, [id]: data }))

        stepIdx === stepsToValidate.length - 1 && setActiveStep(stepToAdvance)
      } catch (validateError) {
        setErrors(validateError)
      }
    })
  }

  const handleNext = async () => {
    try {
      const { id, data } = await validateSchema(activeStep)

      if (activeStep === lastStep) {
        const submitData = { ...formData, [id]: data }
        const schemaData = schema().cast(submitData, {
          context: submitData,
          isSubmit: true,
        })
        onSubmit(schemaData)
      } else {
        setFormData((prev) => ({ ...prev, [id]: data }))
        setActiveStep((prevActiveStep) => prevActiveStep + 1)
      }
    } catch (validateError) {
      setErrors(validateError)
    }
  }

  const handleBack = useCallback(
    (stepToBack) => {
      if (activeStep < FIRST_STEP) return

      const { id } = steps[activeStep]
      const stepData = watch(id)

      setFormData((prev) => ({ ...prev, [id]: stepData }))
      setActiveStep((prevStep) =>
        Number.isInteger(stepToBack) ? stepToBack : prevStep - 1
      )
    },
    [activeStep]
  )

  const { id: stepId, content: Content } = useMemo(
    () => steps[activeStep],
    [formData, activeStep]
  )

  return (
    <>
      {/* STEPPER */}
      {useMemo(
        () =>
          isMobile ? (
            <CustomMobileStepper
              steps={steps}
              totalSteps={totalSteps}
              activeStep={activeStep}
              lastStep={lastStep}
              disabledBack={disabledBack}
              isSubmitting={isLoading}
              handleNext={handleNext}
              handleBack={handleBack}
              errors={errors}
            />
          ) : (
            <CustomStepper
              steps={steps}
              activeStep={activeStep}
              lastStep={lastStep}
              disabledBack={disabledBack}
              isSubmitting={isLoading}
              handleStep={handleStep}
              handleNext={handleNext}
              handleBack={handleBack}
              errors={errors}
            />
          ),
        [isLoading, isMobile, activeStep, errors[stepId]]
      )}
      {/* FORM CONTENT */}
      {Content && <Content data={formData[stepId]} setFormData={setFormData} />}
    </>
  )
}

FormStepper.propTypes = {
  steps: PropTypes.array,
  schema: PropTypes.func,
  onSubmit: PropTypes.func,
}

export { DefaultFormStepper, SkeletonStepsForm }

export default FormStepper
