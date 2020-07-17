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

import React from 'react';
import { Box, Link, useTheme } from '@material-ui/core';
import classnames from 'classnames';

import { by } from 'client/constants';

const { text, url } = by;

const Footer = () => {
  const theme = useTheme();

  return (
    <Box color={theme.palette.primary.light} className={classnames('footer')}>
      {`❤️ by `}
      <Link href={url}>{text}</Link>
    </Box>
  );
};

export default Footer;
