import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, CircularProgress, Backdrop } from '@material-ui/core'

import { useFetchAll, useOpennebula, useApplication } from 'client/hooks'
import { DialogForm } from 'client/components/Dialogs'
import FormStepper from 'client/components/FormStepper'

import { parseApplicationToForm, parseFormToDeployApplication } from 'client/utils'
import Steps from 'client/containers/ApplicationsTemplates/Form/Deploy/Steps'

const useStyles = makeStyles(theme => ({
  backdrop: {
    zIndex: theme.zIndex.appBar,
    color: theme.palette.common.white
  }
}))

const DeployForm = ({ applicationTemplate, handleCancel }) => {
  const classes = useStyles()
  const [vmTemplates, setVmTemplates] = useState([])
  const { instantiateApplicationTemplate } = useApplication()
  const { getTemplate } = useOpennebula()
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
        getTemplate({ id: templateId }).then(vmTemplate =>
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

    return instantiateApplicationTemplate({
      id: applicationTemplate.ID,
      data: application,
      instances
    }).then(() => handleCancel())
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
