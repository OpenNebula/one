import React, { useEffect, useCallback } from 'react'

import { Divider, Paper, Typography } from '@material-ui/core'

import useOpennebula from 'client/hooks/useOpennebula'
import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'networking'

const Networks = () => ({
  id: STEP_ID,
  label: 'Configure Networking',
  resolver: STEP_FORM_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(({ data }) => {
    const { getVNetworks, getVNetworksTemplates } = useOpennebula()

    useEffect(() => {
      getVNetworks()
      getVNetworksTemplates()
    }, [])

    return data?.map(({ id, name, description }, index) => (
      <Paper
        key={`net-${id}`}
        variant="outlined"
        style={{ marginTop: 10, marginBottom: 10, padding: 10 }}
      >
        <Typography variant="body1">{name}</Typography>
        {description && <Typography variant="body2">{description}</Typography>}
        <Divider style={{ marginBottom: 8 }} />
        <FormWithSchema
          cy="deploy-network"
          fields={FORM_FIELDS}
          id={`${STEP_ID}[${index}]`}
        />
      </Paper>
    ))
  }, [])
})

export default Networks
