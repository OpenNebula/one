import React, { useEffect, useState } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box, Typography, Divider } from '@material-ui/core'
import RefreshIcon from '@material-ui/icons/Autorenew'

import { PATH } from 'client/router/fireedge'
import useApplication from 'client/hooks/useApplication'
import useFetch from 'client/hooks/useFetch'

import DeployForm from 'client/containers/ApplicationsTemplates/Form/Deploy'
import SubmitButton from 'client/components/FormControl/SubmitButton'
import ListCards from 'client/components/List/ListCards'
import AlertError from 'client/components/Alerts/Error'
import { ApplicationTemplateCard } from 'client/components/Cards'

import { Tr } from 'client/components/HOC'
import {
  ApplicationsTemplates as ApplicationsTemplatesLabel,
  CannotConnectOneFlow
} from 'client/constants/translates'

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
      <Box p={3} display="flex" alignItems="center">
        <SubmitButton
          fab
          onClick={() => fetchRequest(undefined, { reload: true, delay: 500 })}
          isSubmitting={loading || reloading}
          label={<RefreshIcon />}
        />
        <Typography variant="h5" style={{ marginLeft: 8 }}>
          {Tr(ApplicationsTemplatesLabel)}
        </Typography>
      </Box>
      <Divider />
      <Box p={3}>
        {error ? (
          <AlertError>
            {Tr(CannotConnectOneFlow)}
          </AlertError>
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
