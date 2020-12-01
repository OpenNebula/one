import React, { useState, useEffect, createElement } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'

import { PATH } from 'client/router/provision'
import useProvision from 'client/hooks/useProvision'
import useFetch from 'client/hooks/useFetch'
import useSearch from 'client/hooks/useSearch'

import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'

import { DialogRequest } from 'client/components/Dialogs'
import DialogInfo from 'client/containers/Provisions/DialogInfo'
import { T } from 'client/constants'

function Provisions () {
  const history = useHistory()
  const [showDialog, setShowDialog] = useState(false)

  const { provisions, getProvisions, getProvision, deleteProvision } = useProvision()

  const { error, fetchRequest, loading, reloading } = useFetch(getProvisions)
  const { result, handleChange } = useSearch({
    list: provisions,
    listOptions: { shouldSort: true, keys: ['ID', 'NAME'] }
  })

  useEffect(() => { fetchRequest() }, [])

  const handleCancel = () => setShowDialog(false)

  return (
    <Container disableGutters>
      <ListHeader
        title={T.Provisions}
        reloadButtonProps={{
          onClick: () => fetchRequest(undefined, { reload: true }),
          isSubmitting: Boolean(loading || reloading)
        }}
        addButtonProps={{ onClick: () => history.push(PATH.PROVISIONS.CREATE) }}
        searchProps={{ handleChange }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneProvision}</AlertError>
        ) : (
          <ListCards
            list={result ?? provisions}
            isLoading={provisions.length === 0 && loading}
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
                icon: <DeleteIcon color='error' />,
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
            handleCancel,
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
          {props => createElement(showDialog.content, props)}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Provisions
