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

import React, { useState } from 'react';
import {
  Button,
  TextField,
  Grid,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@material-ui/core';
import PropTypes from 'prop-types';
import constants from '../../../constants';
import commands from '../../../../config/commands-params';
import { requestData } from '../../../utils';
import { Translate, Tr } from '../../HOC';

const { Submit, Response } = constants;

const InputsComponents = ({ name, value, onChange }) => (
  <Grid item>
    <TextField
      key={`api-key-${name}`}
      name={name}
      label={name}
      multiline
      rows="4"
      defaultValue={value}
      variant="outlined"
      fullWidth
      style={{ width: '100%', marginBottom: '1rem' }}
      onChange={e => {
        onChange(e?.target?.value || '', name);
      }}
    />
  </Grid>
);
InputsComponents.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
    PropTypes.number,
    PropTypes.array
  ]),
  onChange: PropTypes.func
};

InputsComponents.defaultProps = {
  name: '',
  value: '',
  onChange: () => undefined
};

const ResponseComponent = ({ data = '' }) => (
  <TextField
    disabled
    label={Tr(Response)}
    multiline
    rows="4"
    value={data}
    variant="outlined"
    fullWidth
    InputProps={{ style: { height: '100%' } }}
    // eslint-disable-next-line react/jsx-no-duplicate-props
    inputProps={{ style: { height: '100%' } }}
    style={{ height: '100%' }}
  />
);
ResponseComponent.propTypes = {
  data: PropTypes.string
};

ResponseComponent.defaultProps = {
  data: ''
};

const FormComponent = ({ title = '', params = {}, method = 'GET' }) => {
  const [data, setData] = useState('');
  const [paramsState, setParamsState] = useState(params);
  const handleValue = (value, name) => {
    paramsState[name] = { ...paramsState[name], value };
    setParamsState(paramsState);
  };

  const body = () => {
    const rtn = {};
    // eslint-disable-next-line no-unused-expressions
    Object.entries(paramsState)?.forEach(([name, value]) => {
      if (value?.from === 'POST_BODY') {
        rtn[name] = value.value || value.default;
      }
    });
    return rtn;
  };

  const query = () => {
    let rtn = '';
    // eslint-disable-next-line no-unused-expressions
    Object.entries(paramsState)?.forEach(([name, value]) => {
      if (value?.from === 'QUERY') {
        rtn += `${rtn.length ? '&' : ''}${name}=${encodeURI(
          value.value || value.default
        )}`;
      }
    });
    return `?${rtn}`;
  };

  const resource = () => {
    let rtn = '';
    // eslint-disable-next-line no-unused-expressions
    Object.entries(paramsState)?.forEach(([name, value]) => {
      if (value?.from === 'RESOURCE') {
        rtn = `/${value.value || value.default}`;
      }
    });
    return rtn;
  };

  const postParams = {
    data: body(),
    method,
    authenticate: true
  };

  const url = () => `api/${title.replace('.', '/') + resource() + query()}`;

  const handleSubmit = e => {
    if (e && e.preventDefault) {
      e.preventDefault();
      requestData(url(), postParams).then(response => {
        if (response && response.id) {
          const { id } = response;
          if (id === 401) {
            console.log('ERROR');
          } else if (id === 200) {
            setData(JSON.stringify(response));
          }
        }
      });
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs>
        <form onSubmit={e => handleSubmit(e, method)} autoComplete="off">
          <Grid container direction="column">
            {Object.entries(paramsState)?.map(([name, paramState]) => {
              const { default: defaultValue, value } = paramState;
              return (
                <InputsComponents
                  name={name}
                  value={value || defaultValue}
                  key={`form-api-${name}`}
                  onChange={handleValue}
                />
              );
            })}
            <Grid item style={{ textAlign: 'right' }}>
              <Button variant="contained" color="primary" type="submit">
                <Translate word={Submit} />
              </Button>
            </Grid>
          </Grid>
        </form>
      </Grid>
      <Grid item xs>
        <ResponseComponent data={data} />
      </Grid>
    </Grid>
  );
};
FormComponent.propTypes = {
  title: PropTypes.string,
  params: PropTypes.shape({}),
  method: PropTypes.string
};

FormComponent.defaultProps = {
  title: '',
  params: {},
  method: 'GET'
};

const Group = ({ title = '', params = {}, method = 'GET' }) => (
  <Grid item xs={12} style={{ marginBottom: '2rem' }}>
    <h2>{title}</h2>
    <FormComponent title={title} params={params} method={method} />
  </Grid>
);
Group.propTypes = {
  title: PropTypes.string,
  params: PropTypes.shape({}),
  method: PropTypes.string
};

Group.defaultProps = {
  title: '',
  params: {},
  method: 'GET'
};

const Selector = ({ selected = '', setActionSelected = () => undefined }) => {
  const handleChange = e => {
    setActionSelected(e?.target?.value || '');
  };
  return (
    <FormControl variant="outlined" fullWidth>
      <InputLabel>
        <Translate word="Select Action" />
      </InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="select-action"
        value={selected}
        onChange={handleChange}
        label={Tr('Select Action')}
      >
        <MenuItem value="">
          <Translate word="none" />
        </MenuItem>
        {Object.keys(commands)?.map(action => (
          <MenuItem key={`selector-action-${action}`} value={action}>
            {action}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
Selector.propTypes = {
  selected: PropTypes.string,
  setActionSelected: PropTypes.func
};

Selector.defaultProps = {
  selected: '',
  setActionSelected: () => undefined
};

const RenderAction = ({ selected }) => {
  let rtn = '';
  if (selected && commands[selected]) {
    const values = commands[selected];
    const method = (values && values.httpMethod) || 'GET';
    const params = values && values.params;
    rtn = (
      <Group
        title={selected}
        params={params}
        method={method}
        key={`group-api${selected}`}
      />
    );
  }
  return rtn;
};
RenderAction.propTypes = {
  selected: PropTypes.string
};
RenderAction.defaultProps = {
  selected: ''
};

const TestApi = () => {
  const [actionSelected, setActionSelected] = useState('');
  return (
    <Container>
      <Grid container direction="row">
        <Grid container spacing={2}>
          <Grid item xs style={{ padding: '2rem 0' }}>
            <Selector
              selected={actionSelected}
              setActionSelected={setActionSelected}
            />
          </Grid>
        </Grid>
        <RenderAction selected={actionSelected} />
      </Grid>
    </Container>
  );
};

export default TestApi;
