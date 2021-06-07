import React, { useEffect } from 'react'

import { Container, Box } from '@material-ui/core'
import { Trash as DeleteIcon } from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useVm, useVmApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { useFetch, useSearch } from 'client/hooks'

import { ListHeader, ListCards } from 'client/components/List'
import { VirtualMachineCard } from 'client/components/Cards'
// import { DialogRequest } from 'client/components/Dialogs'
// import Information from 'client/containers/VirtualMachines/Sections/info'
import { T } from 'client/constants'
import { filterDoneVms } from 'client/models/VirtualMachine'

function VirtualMachines () {
  // const [showDialog, setShowDialog] = useState(false)

  const vms = useVm()
  const { getVm, getVms, terminateVm } = useVmApi()
  const { filterPool } = useAuth()

  const { enqueueSuccess } = useGeneralApi()

  const { fetchRequest, loading, reloading } = useFetch(getVms)
  const { result, handleChange } = useSearch({
    list: vms,
    listOptions: { shouldSort: true, keys: ['ID', 'NAME'] }
  })

  useEffect(() => { fetchRequest() }, [filterPool])

  // const handleCancel = () => setShowDialog(false)

  return (
    <Container disableGutters>
      <ListHeader
        title={T.VMs}
        reloadButtonProps={{
          onClick: () => fetchRequest(undefined, { reload: true }),
          isSubmitting: Boolean(loading || reloading)
        }}
        searchProps={{ handleChange }}
      />
      <Box p={3}>
        <ListCards
          list={result ?? filterDoneVms(vms)}
          isLoading={vms.length === 0 && loading}
          gridProps={{ 'data-cy': 'vms' }}
          CardComponent={VirtualMachineCard}
          cardsProps={({ value: { ID, NAME } }) => ({
            actions: [
              {
                handleClick: () => terminateVm(ID)
                  .then(() => enqueueSuccess(`VM terminate - ID: ${ID}`))
                  .then(() => fetchRequest(undefined, { reload: true })),
                icon: <DeleteIcon color='error' />,
                cy: 'vm-delete'
              }
            ]
          })}
        />
      </Box>
      {/* {showDialog !== false && (
        <DialogRequest
          request={() => getVm(showDialog.id)}
          dialogProps={{ handleCancel, ...showDialog }}
        >
          {({ data }) => <Information data={data} />}
        </DialogRequest>
      )} */}
    </Container>
  )
}

export default VirtualMachines
