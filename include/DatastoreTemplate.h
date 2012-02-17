/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef DATASTORE_TEMPLATE_H_
#define DATASTORE_TEMPLATE_H_

#include "Template.h"

using namespace std;

/**
 *  Datastore Template class
 */
class DatastoreTemplate : public Template
{
public:
    DatastoreTemplate():
        Template(false,'=',"TEMPLATE"){};

    ~DatastoreTemplate(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*DATASTORE_TEMPLATE_H_*/
