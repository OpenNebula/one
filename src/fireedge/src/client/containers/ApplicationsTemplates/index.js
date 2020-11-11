import React, { useEffect, useState } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import { PATH } from 'client/router/fireedge'
import useApplication from 'client/hooks/useApplication'
import useFetch from 'client/hooks/useFetch'

import DeployForm from 'client/containers/ApplicationsTemplates/Form/Deploy'
import ListCards from 'client/components/List/ListCards'
import { ApplicationTemplateCard } from 'client/components/Cards'

import { Tr } from 'client/components/HOC'
import { CannotConnectOneFlow } from 'client/constants/translates'

const Error = () => (
  <Box pt={3} display="flex" justifyContent="center">
    <Alert severity="error" icon={false} variant="filled">
      {Tr(CannotConnectOneFlow)}
    </Alert>
  </Box>
)

function ApplicationsTemplates () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)
  const { applicationsTemplates, getApplicationsTemplates } = useApplication()
  const { fetchRequest, loading, error } = useFetch(getApplicationsTemplates)

  useEffect(() => {
    fetchRequest()
  }, [])

  if (error) {
    return <Error />
  }

  return (
    <Container disableGutters>
      <Box p={3}>
        <ListCards
          list={applicationsTemplates}
          isLoading={applicationsTemplates?.length === 0 && loading}
          handleCreate={() => history.push(PATH.APPLICATIONS_TEMPLATES.CREATE)}
          CardComponent={ApplicationTemplateCard}
          cardsProps={({ value }) => ({
            handleEdit: () =>
              history.push(PATH.APPLICATIONS_TEMPLATES.EDIT.replace(':id', value?.ID)),
            handleDeploy: () => setShowDialog(value),
            handleRemove: undefined
          })}
        />
        {showDialog !== false && (
          <DeployForm
            applicationTemplate={showDialog}
            handleCancel={() => setShowDialog(false)}
          />
        )}
      </Box>
    </Container>
  )
}

export default ApplicationsTemplates
