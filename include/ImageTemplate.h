/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

    ImageTemplate(const ImageTemplate& tmpl):Template(tmpl){};

    ~ImageTemplate(){};

    /**
     *  Checks the template for RESTRICTED ATTRIBUTES
     *    @param rs_attr the first restricted attribute found if any
     *    @return true if a restricted attribute is found in the template
     */
    bool check(string& rs_attr)
    {
        return Template::check(rs_attr, restricted_attributes);
    };

    /**
     * Deletes all restricted attributes
     */
    void remove_restricted()
    {
        Template::remove_restricted(restricted_attributes);
    };

    /**
     * Deletes all the attributes, except the restricted ones
     */
    void remove_all_except_restricted()
    {
        Template::remove_all_except_restricted(restricted_attributes);
    };

    bool is_saving()
    {
        bool save_as_hot;

        get("SAVE_AS_HOT", save_as_hot);

        return save_as_hot;
    }

    void set_saving()
    {
        replace("SAVE_AS_HOT", "YES");
    }

private:
    friend class ImagePool;

    static vector<string> restricted_attributes;

    bool has_restricted()
    {
        return restricted_attributes.size() > 0;
    };

    /**
     * Stores the attributes as restricted, these attributes will be used in
     * ImageTemplate::check
     * @param rattrs Attributes to restrict
     */
    static void set_restricted_attributes(vector<const SingleAttribute *>& rattrs)
    {
        Template::set_restricted_attributes(rattrs, restricted_attributes);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*IMAGE_TEMPLATE_H_*/
