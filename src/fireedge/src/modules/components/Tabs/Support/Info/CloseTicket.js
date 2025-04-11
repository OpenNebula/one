/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { Grid, Stack, TextField } from '@mui/material'
import { StatusChip, StatusCircle } from '@modules/components/Status'
import { T } from '@ConstantsModule'
import { SupportAPI } from '@FeaturesModule'
import { getSupportState } from '@ModelsModule'
import { Cancel as CancelIcon, Check, EditPencil } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, useState } from 'react'
import { Tr } from '@modules/components/HOC'
import { SubmitButton } from '@modules/components/FormControl'

const dataCyResolution = 'change-resolution'

/**
 * Close Ticket.
 *
 * @param {object} props - The props object
 * @param {object} props.ticket - Ticket
 * @returns {Component} The rendered component.
 */
const CloseTicket = ({ ticket = undefined }) => {
  if (!ticket) return null

  const { id } = ticket
  const { name: stateName, color: stateColor } = getSupportState(ticket)
  const [edit, setEdit] = useState(false)
  const [update] = SupportAPI.useUpdateTicketMutation()
  const [comment, setComment] = useState('')

  const onSubmit = async () => {
    update({
      id,
      body: comment,
      solved: true,
    })
    setEdit(false)
  }

  const handleInputChange = (event) => {
    setComment(event.target.value)
  }

  return (
    <>
      {edit ? (
        <Grid
          container
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
        >
          <Grid item xs={8}>
            <TextField
              label={Tr(T.AddComment)}
              onChange={handleInputChange}
              inputProps={{ 'data-cy': `body-resolution` }}
              value={comment}
              multiline
            />
          </Grid>
          <Grid item xs={4}>
            <SubmitButton
              data-cy={dataCyResolution}
              icon={<Check />}
              onClick={() => onSubmit()}
            />
            <SubmitButton
              icon={<CancelIcon />}
              onClick={() => setEdit(false)}
            />
          </Grid>
        </Grid>
      ) : (
        <Grid
          container
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
        >
          <Grid item xs={8}>
            <Stack direction="row" alignItems="center" gap={1}>
              <StatusCircle color={stateColor} />
              <StatusChip
                dataCy="state"
                text={stateName}
                stateColor={stateColor}
              />
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <SubmitButton
              data-cy={dataCyResolution}
              icon={<EditPencil />}
              onClick={() => setEdit(true)}
              tooltip={T.ResolutionTicket}
            />
          </Grid>
        </Grid>
      )}
    </>
  )
}

CloseTicket.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.number,
  }),
}

CloseTicket.displayName = 'CloseTicket'

export default CloseTicket
