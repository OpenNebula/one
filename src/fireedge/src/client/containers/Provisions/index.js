import React, { useState, useEffect, createElement } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box, Typography, Divider } from '@material-ui/core'
import RefreshIcon from '@material-ui/icons/Autorenew'
import DeleteIcon from '@material-ui/icons/Delete'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import ListCards from 'client/components/List/ListCards'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'

import { DialogRequest } from 'client/components/Dialogs'
import DialogInfo from 'client/containers/Provisions/DialogInfo'

import { ProvisionsLabel, CannotConnectOneProvision } from 'client/constants/translates'
import { Tr } from 'client/components/HOC'

function Provisions () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)

  const {
    provisions,
    getProvisions,
    getProvision,
    deleteProvision
  } = useProvision()

  const { error, fetchRequest, loading, reloading } = useFetch(getProvisions)

  useEffect(() => { fetchRequest() }, [])

  return (
    <Container disableGutters>
      <Box p={3} display="flex" alignItems="center">
        <SubmitButton
          fab
          onClick={() => fetchRequest(undefined, { reload: true })}
          isSubmitting={loading || reloading}
          label={<RefreshIcon />}
        />
        <Typography variant="h5" style={{ marginLeft: 8 }}>
          {Tr(ProvisionsLabel)}
        </Typography>
      </Box>
      <Divider />
      <Box p={3}>
        {error ? (
          <AlertError>{Tr(CannotConnectOneProvision)}</AlertError>
        ) : (
          <ListCards
            list={provisions}
            isLoading={provisions.length === 0 && loading}
            handleCreate={() => history.push(PATH.PROVISIONS.CREATE)}
            CardComponent={ProvisionCard}
            cardsProps={({ value: { ID, NAME } }) => ({
              handleClick: () => setShowDialog({
                id: ID,
                title: `(ID: ${ID}) ${NAME}`,
                content: DialogInfo
              }),
              actions: [{
                handleClick: () => setShowDialog({
                  id: ID,
                  title: `DELETE provision - (ID: ${ID}) ${NAME}`,
                  handleAccept: () => {
                    deleteProvision({ id: ID })
                    setShowDialog(false)
                  },
                  content: DialogInfo
                }),
                icon: DeleteIcon,
                iconProps: { color: 'error' },
                cy: `provision-delete-${ID}`
              }]
            })}
            breakpoints={{ xs: 12, sm: 6, md: 4 }}
          />
        )}
      </Box>
      {showDialog !== false && (
        <DialogRequest
          request={() => getProvision({ id: showDialog.id })}
          dialogProps={{
            title: showDialog.title,
            handleCancel: () => setShowDialog(false),
            handleAccept: showDialog.handleAccept,
            contentProps: {
              style: {
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }
            }
          }}
        >
          {({ data }) => createElement(showDialog.content, { data })}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Provisions
