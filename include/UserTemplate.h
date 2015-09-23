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

#ifndef USER_TEMPLATE_H_
#define USER_TEMPLATE_H_

#include "Template.h"

using namespace std;

/**
 *  User Template class, it represents the attributes of an user
 */
class UserTemplate : public Template
{
public:
    UserTemplate() : Template(true,'=',"TEMPLATE"){};

    ~UserTemplate(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*USER_TEMPLATE_H_*/
