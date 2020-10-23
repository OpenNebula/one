import React, { useEffect } from 'react'

import { useHistory } from 'react-router-dom'
import { Box, LinearProgress } from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import { PATH } from 'client/router/fireedge'
import useApplication from 'client/hooks/useApplication'
import useFetch from 'client/hooks/useFetch'

// import DeployForm from 'client/containers/Applications/Form'
import ListCards from 'client/components/List/ListCards'
import { ApplicationTemplateCard } from 'client/components/Cards'
import { Tr } from 'client/components/HOC'

const ApplicationsTemplates = () => {
  const history = useHistory()
  // const [showDialog, setShowDialog] = useState(false)
  const { applicationsTemplates, getApplicationsTemplates } = useApplication()
  const { fetchRequest, loading, error } = useFetch(getApplicationsTemplates)

  useEffect(() => {
    fetchRequest()
  }, [])

  if (error) {
    return (
      <Box pt={3} display="flex" justifyContent="center">
        <Alert severity="error" icon={false} variant="filled">
          {Tr('Cannot connect to OneFlow server')}
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box p={3}>
      <ListCards
        list={applicationsTemplates}
        handleCreate={() => history.push(PATH.APPLICATIONS_TEMPLATES.CREATE)}
        CardComponent={ApplicationTemplateCard}
        cardsProps={({ value: { ID } }) => ({
          handleEdit: () =>
            history.push(PATH.APPLICATIONS_TEMPLATES.EDIT.replace(':id', ID)),
          // handleShow: () => setShowDialog(ID),
          handleRemove: undefined
        })}
      />
      {/* {showDialog !== false && (
        <DeployForm id={showDialog} handleCancel={() => setShowDialog(false)} />
      )} */}
    </Box>
  )
}

export default ApplicationsTemplates
