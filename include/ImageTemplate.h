/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
        string saving;

        get(saving_attribute, saving);

        return (saving.empty() == false);
    }

    bool is_saving_hot()
    {
        string save_as_hot;

        get(saving_hot_attribute, save_as_hot);

        return (save_as_hot.empty() == false);
    }

    void set_saving()
    {
        SingleAttribute * attr= new SingleAttribute(saving_attribute, "YES");

        erase(saving_attribute);

        set(attr);
    }

    void set_saving_hot()
    {
        SingleAttribute * attr = new SingleAttribute(saving_hot_attribute,"YES");

        erase(saving_hot_attribute);

        set(attr);
    }

    void unset_saving()
    {
        erase(saving_attribute);
    }

private:
    friend class ImagePool;

    static vector<string> restricted_attributes;

    static string saving_attribute;
    static string saving_hot_attribute;

    bool has_restricted()
    {
        return restricted_attributes.size() > 0;
    };

    /**
     * Stores the attributes as restricted, these attributes will be used in
     * ImageTemplate::check
     * @param rattrs Attributes to restrict
     */
    static void set_restricted_attributes(vector<const Attribute *>& rattrs)
    {
        Template::set_restricted_attributes(rattrs, restricted_attributes);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*IMAGE_TEMPLATE_H_*/
