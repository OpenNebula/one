import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, CircularProgress, Backdrop } from '@material-ui/core'

import { useFetchAll } from 'client/hooks'
import { useApplicationTemplateApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'

import { DialogForm } from 'client/components/Dialogs'
import FormStepper from 'client/components/FormStepper'
import Steps from 'client/containers/ApplicationsTemplates/Form/Deploy/Steps'
import { parseApplicationToForm, parseFormToDeployApplication } from 'client/utils'

const useStyles = makeStyles(theme => ({
  backdrop: {
    zIndex: theme.zIndex.appBar,
    color: theme.palette.common.white
  }
}))

const DeployForm = ({ applicationTemplate, handleCancel }) => {
  const classes = useStyles()
  const [vmTemplates, setVmTemplates] = useState([])

  const { enqueueInfo } = useGeneralApi()
  const { getApplicationsTemplates, instantiateApplicationTemplate } = useApplicationTemplateApi()
  const { data, fetchRequestAll, loading } = useFetchAll()

  const applicationParsed = useMemo(() =>
    parseApplicationToForm(applicationTemplate)
  , [])

  const { steps, resolvers } = Steps({
    applicationTemplate: applicationParsed,
    vmTemplates
  })

  useEffect(() => {
    const { tiers } = applicationParsed

    const fetchTemplates = tiers
      ?.map(({ template: { id } }) => id)
      ?.reduce((list, templateId) =>
        list.includes(templateId) ? list : [...list, templateId]
      , [])
      ?.map(templateId =>
        getApplicationsTemplates(templateId).then(vmTemplate =>
          setVmTemplates(prev => [...prev, vmTemplate])
        )
      )

    fetchRequestAll(fetchTemplates)
  }, [applicationParsed])

  const handleSubmit = values => {
    const {
      instances,
      ...application
    } = parseFormToDeployApplication(values, applicationParsed)

    return Promise
      .all([...new Array(instances)]
        .map(() => instantiateApplicationTemplate(applicationTemplate.ID, application))
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
      <FormStepper
        steps={steps}
        schema={resolvers}
        onSubmit={handleSubmit}
      />
    </DialogForm>
  )
}

DeployForm.propTypes = {
  applicationTemplate: PropTypes.object.isRequired,
  handleCancel: PropTypes.func
}

DeployForm.defaultProps = {
  applicationTemplate: undefined,
  handleCancel: undefined
}

export default DeployForm
