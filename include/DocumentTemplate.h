/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef DOCUMENT_TEMPLATE_H_
#define DOCUMENT_TEMPLATE_H_

#include "Template.h"

/**
 *  Document Template class, it represents the attributes of a Document
 */
class DocumentTemplate : public Template
{
public:
    DocumentTemplate() : Template(false, '=', "TEMPLATE") {};

    ~DocumentTemplate() {};

    DocumentTemplate(DocumentTemplate& dt):Template(dt) {};

    DocumentTemplate(const Template& tmpl):Template(tmpl) {};

    // -------------------------------------------------------------------------
    // Encrypted attributes interface implementation
    // -------------------------------------------------------------------------
    void encrypt(const std::string& one_key) override
    {
        Template::encrypt(one_key, encrypted);
    }

    void decrypt(const std::string& one_key) override
    {
        Template::decrypt(one_key, encrypted);
    }

    static void parse_encrypted(const std::vector<const SingleAttribute *>& ea)
    {
        Template::parse_encrypted(ea, encrypted);
    }

private:
    /**
     *  Encrypted attribute list for DocumentTemplates
     */
    static std::map<std::string, std::set<std::string> > encrypted;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*DOCUMENT_TEMPLATE_H_*/
