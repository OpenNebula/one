/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Tr } from 'client/components/HOC'

import { STEP_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import {
  HOST_REQ_FIELD,
  HOST_RANK_FIELD,
  DS_REQ_FIELD,
  DS_RANK_FIELD
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { T } from 'client/constants'

const useStyles = makeStyles({
  root: {
    paddingBlock: '1em',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, auto))',
    gap: '1em'
  }
})

const Placement = () => {
  const classes = useStyles()

  // TODO - Host requirements: add button to select HOST in list => ID="<id>"
  // TODO - Host policy options: Packing|Stripping|Load-aware

  // TODO - DS requirements: add button to select DATASTORE in list => ID="<id>"
  // TODO - DS policy options: Packing|Stripping

  return (
    <>
      <FormWithSchema
        className={classes.information}
        cy='instantiate-vm-template-extra.host-placement'
        fields={[HOST_REQ_FIELD, HOST_RANK_FIELD]}
        legend={Tr(T.Host)}
        id={STEP_ID}
      />
      <FormWithSchema
        className={classes.information}
        cy='instantiate-vm-template-extra.ds-placement'
        fields={[DS_REQ_FIELD, DS_RANK_FIELD]}
        legend={Tr(T.Datastore)}
        id={STEP_ID}
      />
    </>
  )
}

Placement.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func
}

Placement.displayName = 'Placement'

export default Placement
