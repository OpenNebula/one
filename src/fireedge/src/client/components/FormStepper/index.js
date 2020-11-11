import React, { useState, useMemo, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useFormContext } from 'react-hook-form'
import { useMediaQuery } from '@material-ui/core'

import CustomMobileStepper from 'client/components/FormStepper/MobileStepper'
import CustomStepper from 'client/components/FormStepper/Stepper'
import { groupBy } from 'client/utils/helpers'

const FIRST_STEP = 0

const FormStepper = ({ steps, schema, onSubmit }) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))
  const { watch, reset, errors, setError } = useFormContext()

  const [formData, setFormData] = useState(() => watch())
  const [activeStep, setActiveStep] = useState(FIRST_STEP)

  const totalSteps = useMemo(() => steps?.length, [steps])
  const lastStep = useMemo(() => totalSteps - 1, [totalSteps])
  const disabledBack = useMemo(() => activeStep === FIRST_STEP, [activeStep])

  useEffect(() => {
    reset({ ...formData }, { errors: false })
  }, [formData])

  const handleNext = () => {
    const { id, resolver, optionsValidate } = steps[activeStep]
    const currentData = watch(id)
    const stepSchema = typeof resolver === 'function' ? resolver() : resolver

    stepSchema
      .validate(currentData, optionsValidate)
      .then(() => {
        if (activeStep === lastStep) {
          onSubmit(schema().cast({ ...formData, [id]: currentData }))
        } else {
          setFormData(prev => ({ ...prev, [id]: currentData }))
          setActiveStep(prevActiveStep => prevActiveStep + 1)
        }
      })
      .catch(({ inner, ...err }) => {
        const errorsByPath = groupBy(inner, 'path') ?? {}
        const totalErrors = Object.keys(errorsByPath).length

        totalErrors > 0
          ? setError(id, {
            type: 'manual',
            message: `${totalErrors} error(s) occurred`
          })
          : setError(id, err)

        inner?.forEach(({ path, type, message }) =>
          setError(`${id}.${path}`, { type, message })
        )
      })
  }

  const handleBack = useCallback(() => {
    if (activeStep <= FIRST_STEP) return

    const { id } = steps[activeStep]
    const currentData = watch(id)

    setFormData(prev => ({ ...prev, [id]: currentData }))
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }, [activeStep])

  const { id, content: Content } = useMemo(() => steps[activeStep], [
    formData,
    activeStep
  ])

  return (
    <>
      {/* STEPPER */}
      {useMemo(() => isMobile ? (
        <CustomMobileStepper
          steps={steps}
          totalSteps={totalSteps}
          activeStep={activeStep}
          lastStep={lastStep}
          disabledBack={disabledBack}
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
          handleNext={handleNext}
          handleBack={handleBack}
          errors={errors}
        />
      ), [isMobile, activeStep, errors[id]])}
      {/* FORM CONTENT */}
      {Content && <Content data={formData[id]} setFormData={setFormData} />}
    </>
  )
}

FormStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
      content: PropTypes.func.isRequired,
      resolver: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object
      ]).isRequired,
      optionsValidate: PropTypes.shape({
        strict: PropTypes.bool,
        abortEarly: PropTypes.bool,
        stripUnknown: PropTypes.bool,
        recursive: PropTypes.bool,
        context: PropTypes.object
      })
    })
  ),
  schema: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  onSubmit: PropTypes.func
}

FormStepper.defaultProps = {
  steps: [],
  schema: {},
  onSubmit: console.log
}

export default FormStepper
