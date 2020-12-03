import React, { useEffect, useState } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'

import { PATH } from 'client/router/flow'
import { useApplication, useFetch } from 'client/hooks'

import DeployForm from 'client/containers/ApplicationsTemplates/Form/Deploy'
import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ApplicationTemplateCard } from 'client/components/Cards'
import { T } from 'client/constants'

function ApplicationsTemplates () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)
  const { applicationsTemplates, getApplicationsTemplates } = useApplication()
  const {
    error,
    fetchRequest,
    loading,
    reloading
  } = useFetch(getApplicationsTemplates)

  useEffect(() => { fetchRequest() }, [])

  return (
    <Container disableGutters>
      <ListHeader
        title={T.ApplicationsTemplates}
        hasReloadButton
        reloadButtonProps={{
          onClick: () => fetchRequest(undefined, { reload: true, delay: 500 }),
          isSubmitting: Boolean(loading || reloading)
        }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneFlow}</AlertError>
        ) : (
          <ListCards
            list={applicationsTemplates}
            isLoading={applicationsTemplates?.length === 0 && loading}
            handleCreate={() => history.push(PATH.APPLICATIONS_TEMPLATES.CREATE)}
            CardComponent={ApplicationTemplateCard}
            cardsProps={({ value }) => ({
              handleEdit: () => history.push(
                PATH.APPLICATIONS_TEMPLATES.EDIT.replace(':id', value?.ID)
              ),
              handleDeploy: () => setShowDialog(value),
              handleRemove: undefined
            })}
            breakpoints={{ xs: 12, sm: 6, md: 4 }}
          />
        )}
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
