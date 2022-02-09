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
import { useEffect, useMemo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useDatastoreApi } from 'client/features/One'
import FormStepper from 'client/components/FormStepper'
import Steps from 'client/components/Forms/MarketplaceApp/CreateForm/Steps'

/**
 * Form to create a Marketplace App.
 *
 * @param {object} props - Props
 * @param {string} props.initialValues - Initial values
 * @param {function():object} props.onSubmit - Handle submit function
 * @returns {JSXElementConstructor} Form component
 */
const CreateForm = ({ initialValues, onSubmit }) => {
  const { getDatastores } = useDatastoreApi()
  const stepsForm = useMemo(() => Steps(initialValues, initialValues), [])
  const { steps, defaultValues, resolver, transformBeforeSubmit } = stepsForm

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolver?.()),
  })

  useEffect(() => {
    getDatastores()
  }, [])

  return (
    <FormProvider {...methods}>
      <FormStepper
        steps={steps}
        schema={resolver}
        onSubmit={(data) => onSubmit(transformBeforeSubmit?.(data) ?? data)}
      />
    </FormProvider>
  )
}

CreateForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func,
}

export default CreateForm
