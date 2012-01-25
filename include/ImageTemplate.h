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

#ifndef IMAGE_TEMPLATE_H_
#define IMAGE_TEMPLATE_H_

#include "Template.h"

using namespace std;

/**
 *  Image Template class, it represents the attributes of an Image
 */
class ImageTemplate : public Template
{
public:
    ImageTemplate() : Template(true,'=',"TEMPLATE"){};

    ~ImageTemplate(){};

    /**
     *  Checks the template for RESTRICTED ATTRIBUTES
     *    @param rs_attr the first restricted attribute found if any
     *    @return true if a restricted attribute is found in the template
     */
    bool check(string& rs_attr);

private:
    /**
     *  Number of restricted attributes
     */
    const static int    RS_ATTRS_LENGTH;

    /**
     *  Restricted template attributes in the form
     *  'SINGLE' or 'VECTOR/ATTR'. Restricted attributes are only
     *  allowed for ONE_ADMIN Group.
     */
    const static string RESTRICTED_ATTRIBUTES[];
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*IMAGE_TEMPLATE_H_*/
