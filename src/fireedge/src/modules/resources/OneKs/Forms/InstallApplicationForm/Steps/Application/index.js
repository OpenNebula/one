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
import { Grid } from '@mui/material'
import { useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { useDisableStep } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { OneKsAPI } from '@FeaturesModule'
import { OneKsApplicationCard } from '@modules/resources/OneKs/ApplicationCard'
import { SCHEMA } from './schema'

export const STEP_ID = 'application'
const USER_INPUTS_ID = 'user_inputs'

const Content = ({ applications = [], clusterId }) => {
  const { control, setValue, getValues, clearErrors } = useFormContext()
  const disableStep = useDisableStep()
  const selectedId = useWatch({ control, name: `${STEP_ID}.APPLICATION_ID` })
  const [getApplication] = OneKsAPI.useLazyGetOneKsApplicationQuery()
  const selectionRef = useRef(0)

  const setDefinition = (application) => {
    const defaults = application?.installDefaults ?? {}

    setValue(`${STEP_ID}.DEFINITION`, application)
    setValue('configuration', {
      RELEASE_NAME: defaults.releaseName ?? '',
      TARGET_NAMESPACE: defaults.targetNamespace ?? '',
      CREATE_NAMESPACE: defaults.createNamespace ?? true,
    })
    disableStep(USER_INPUTS_ID, !(application?.user_inputs?.length > 0))
  }

  const selectApplication = async (application) => {
    const applicationId = application?.id
    if (!applicationId) return
    const selection = ++selectionRef.current

    clearErrors(STEP_ID)
    setValue(STEP_ID, {
      APPLICATION_ID: applicationId,
      DEFINITION: undefined,
      INSTALLABLE: undefined,
      REASONS: [],
    })
    setValue('user_inputs', {})
    setValue('configuration', {
      RELEASE_NAME: '',
      TARGET_NAMESPACE: '',
      CREATE_NAMESPACE: true,
    })
    disableStep(USER_INPUTS_ID, true)

    try {
      const definition = await getApplication({
        application_id: applicationId,
        cluster_id: clusterId,
      }).unwrap()

      if (
        selection !== selectionRef.current ||
        `${getValues(`${STEP_ID}.APPLICATION_ID`)}` !== `${applicationId}`
      ) {
        return
      }

      const selectedApplication = { ...application, ...definition }
      setDefinition(selectedApplication)
      setValue(
        `${STEP_ID}.INSTALLABLE`,
        selectedApplication.installable === true
      )
      setValue(`${STEP_ID}.REASONS`, selectedApplication.reasons ?? [])
    } catch (error) {
      if (
        selection !== selectionRef.current ||
        `${getValues(`${STEP_ID}.APPLICATION_ID`)}` !== `${applicationId}`
      ) {
        return
      }

      setValue(`${STEP_ID}.INSTALLABLE`, false)
      setValue(`${STEP_ID}.REASONS`, [
        typeof error?.data === 'string'
          ? error.data
          : error?.message ?? T.ApplicationDefinitionError,
      ])
    }

    clearErrors(STEP_ID)
  }

  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      {applications.map((application) => (
        <Grid item xs={12} sm={6} md={4} key={application.id}>
          <OneKsApplicationCard
            application={application}
            isSelected={`${selectedId}` === `${application.id}`}
            onClick={(event) => {
              if (!event.target.closest('.card-checkbox')) {
                selectApplication(application)
              }
            }}
            onCheck={() => selectApplication(application)}
          />
        </Grid>
      ))}
    </Grid>
  )
}

Content.propTypes = {
  applications: PropTypes.array,
  clusterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

/**
 * Creates the catalogue selection step.
 *
 * @param {object} props - Step properties
 * @returns {object} Application selection step
 */
const Application = (props) => ({
  id: STEP_ID,
  label: T.Application,
  resolver: SCHEMA(),
  optionsValidate: { abortEarly: false },
  content: () => <Content {...props} />,
})

export default Application
