/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef HOST_TEMPLATE_H_
#define HOST_TEMPLATE_H_

#include "Template.h"

using namespace std;

/**
 *  Host Template class, it represents the attributes of a Host
 */
class HostTemplate : public Template
{
public:
    HostTemplate() : Template(false,'=',"TEMPLATE"){};

    ~HostTemplate(){};

};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*HOST_TEMPLATE_H_*/
