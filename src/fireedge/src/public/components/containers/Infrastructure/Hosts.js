/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import MaterialTable from 'one-datatable';
import { Refresh as RefreshIcon } from '@material-ui/icons';

import { Translate } from '../../HOC';
import { requestData } from '../../../utils';
import HostColumns from './host-columns';

const Hosts = ({ name }) => {
  const tableRef = createRef();

  return (
    <div>
      <MaterialTable
        tableRef={tableRef}
        title={
          <h2>
            <Translate word={name} />
          </h2>
        }
        columns={HostColumns.columns}
        data={query =>
          new Promise(resolve => {
            requestData('/api/hostpool/info').then(result => {
              const values = Object.values(result?.data?.HOST_POOL);
              resolve({
                data: values,
                page: query.page,
                totalCount: values.length
              });
            });
          })
        }
        actions={[
          {
            icon: () => <RefreshIcon />,
            tooltip: 'Refresh Data',
            isFreeAction: true,
            onClick: () => tableRef?.current?.onQueryChange()
          }
        ]}
      />
    </div>
  );
};

Hosts.propTypes = {
  name: PropTypes.string
};

Hosts.defaultProps = {
  name: ''
};

export default Hosts;
