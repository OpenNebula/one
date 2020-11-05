import React from 'react'
import { useHistory } from 'react-router'

import { Container, Button } from '@material-ui/core'

import { PATH } from 'client/router/provision'

function ProvisionCreateForm () {
  const history = useHistory()

  return (
    <Container disableGutters>
      <h1>{'Create provision form'}</h1>
      <Button
        variant="contained"
        color="primary"
        onClick={() => history.push(PATH.PROVISIONS.LIST)}
      >
        {'⬅️ Back to list provision'}
      </Button>
    </Container>
  )
}

ProvisionCreateForm.propTypes = {}

ProvisionCreateForm.defaultProps = {}

export default ProvisionCreateForm
