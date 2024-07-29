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
/* import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { CircularProgress, Backdrop } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { useFetchAll } from 'client/hooks'
import { useGeneralApi } from 'client/features/General'
import {  } from 'client/features/OneApi/serviceTemplate'

import { DialogForm } from 'client/components/Dialogs'
import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/ApplicationsTemplates/Form/Deploy/Steps'
import {
  parseApplicationToForm,
  parseFormToDeployApplication,
} from 'client/utils'

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.appBar,
    color: theme.palette.common.white,
  },
})) */

const DeployForm = () => (
  // const DeployForm = ({ applicationTemplate, handleCancel }) => (

  /* const classes = useStyles()
  const [vmTemplates, setVmTemplates] = useState([])

  const { enqueueInfo } = useGeneralApi()
  const { getApplicationsTemplates, instantiateApplicationTemplate } =
    useApplicationTemplateApi()
  const { data, fetchRequestAll, loading } = useFetchAll()

  const applicationParsed = useMemo(
    () => parseApplicationToForm(applicationTemplate),
    []
  )

  const { steps, resolvers } = Steps({
    applicationTemplate: applicationParsed,
    vmTemplates,
  })

  useEffect(() => {
    const { tiers } = applicationParsed

    const fetchTemplates = tiers
      ?.map(({ template: { id } }) => id)
      ?.reduce(
        (list, templateId) =>
          list.includes(templateId) ? list : [...list, templateId],
        []
      )
      ?.map((templateId) =>
        getApplicationsTemplates(templateId).then((vmTemplate) =>
          setVmTemplates((prev) => [...prev, vmTemplate])
        )
      )

    fetchRequestAll(fetchTemplates)
  }, [applicationParsed])

  const handleSubmit = (values) => {
    const { instances, ...application } = parseFormToDeployApplication(
      values,
      applicationParsed
    )

    return Promise.all(
      [...new Array(instances)].map(() =>
        instantiateApplicationTemplate(applicationTemplate.ID, application)
      )
    )
      .then(() => handleCancel())
      .then(() => enqueueInfo(`Template instantiate - x${instances}`))
  }

  if ((applicationTemplate && !data) || loading) {
    return (
      <Backdrop open onClick={handleCancel} className={classes.backdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  return (
    <DialogForm
      open
      title={'Deploy application form'}
      resolver={resolvers}
      values={resolvers().cast(applicationParsed)}
      onCancel={handleCancel}
    >
      <FormStepper steps={steps} schema={resolvers} onSubmit={handleSubmit} />
    </DialogForm>
  ) */

  <>{'Deploy service template form WIP'}</>
)

/* DeployForm.propTypes = {
  applicationTemplate: PropTypes.object.isRequired,
  handleCancel: PropTypes.func,
}

DeployForm.defaultProps = {
  applicationTemplate: undefined,
  handleCancel: undefined,
} */

export default DeployForm
