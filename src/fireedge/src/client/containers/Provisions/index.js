import React, { useState, useEffect, createElement } from 'react'

import { useHistory } from 'react-router-dom'
import { Container, Box } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Settings'
import DeleteIcon from '@material-ui/icons/Delete'

import { PATH } from 'client/apps/provision/routes'
import { useFetch, useSearch } from 'client/hooks'
import { useProvision, useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'

import { ListHeader, ListCards } from 'client/components/List'
import AlertError from 'client/components/Alerts/Error'
import { ProvisionCard } from 'client/components/Cards'

import { DialogRequest } from 'client/components/Dialogs'
import DialogInfo from 'client/containers/Provisions/DialogInfo'
import { T } from 'client/constants'

function Provisions () {
  const history = useHistory()
  const [{ content, ...showDialog } = {}, setShowDialog] = useState()
  const handleCloseDialog = () => setShowDialog()

  const { enqueueInfo } = useGeneralApi()
  const provisions = useProvision()

  const {
    getProvisions,
    getProvision,
    configureProvision,
    deleteProvision
  } = useProvisionApi()

  const { error, fetchRequest, loading, reloading } = useFetch(getProvisions)

  const { result, handleChange } = useSearch({
    list: provisions,
    listOptions: { shouldSort: true, keys: ['ID', 'NAME'] }
  })

  useEffect(() => { fetchRequest() }, [])

  return (
    <Container disableGutters>
      <ListHeader
        title={T.Provisions}
        reloadButtonProps={{
          'data-cy': 'refresh-provision-list',
          onClick: () => fetchRequest(undefined, { reload: true }),
          isSubmitting: Boolean(loading || reloading)
        }}
        addButtonProps={{
          'data-cy': 'create-provision',
          onClick: () => history.push(PATH.PROVISIONS.CREATE)
        }}
        searchProps={{ handleChange }}
      />
      <Box p={3}>
        {error ? (
          <AlertError>{T.CannotConnectOneProvision}</AlertError>
        ) : (
          <ListCards
            list={result ?? provisions}
            isLoading={provisions.length === 0 && loading}
            gridProps={{ 'data-cy': 'provisions' }}
            CardComponent={ProvisionCard}
            cardsProps={({ value: { ID, NAME } }) => ({
              handleClick: () => setShowDialog({
                id: ID,
                title: NAME,
                subheader: `#${ID}`,
                content: props => createElement(DialogInfo, {
                  ...props,
                  displayName: 'DialogDetailProvision'
                })
              }),
              actions: [
                {
                  handleClick: () => configureProvision(ID)
                    .then(() => enqueueInfo(`Configuring provision - ID: ${ID}`))
                    .then(() => fetchRequest(undefined, { reload: true })),
                  icon: <EditIcon />,
                  cy: 'provision-configure'
                },
                {
                  handleClick: () => setShowDialog({
                    id: ID,
                    content: props => createElement(DialogInfo, {
                      ...props,
                      disableAllActions: true,
                      displayName: 'DialogDeleteProvision'
                    }),
                    title: `DELETE - ${NAME}`,
                    subheader: `#${ID}`,
                    handleAccept: () => {
                      handleCloseDialog()

                      return deleteProvision(ID)
                        .then(() => enqueueInfo(`Deleting provision - ID: ${ID}`))
                        .then(() => fetchRequest(undefined, { reload: true }))
                    }
                  }),
                  icon: <DeleteIcon color='error' />,
                  cy: 'provision-delete'
                }
              ]
            })}
          />
        )}
      </Box>
      {content && (
        <DialogRequest
          withTabs
          request={() => getProvision(showDialog.id)}
          dialogProps={{ handleCancel: handleCloseDialog, ...showDialog }}
        >
          {props => content(props)}
        </DialogRequest>
      )}
    </Container>
  )
}

export default Provisions
