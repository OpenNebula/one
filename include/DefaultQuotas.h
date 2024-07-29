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

#ifndef DEFAULT_QUOTAS_H_
#define DEFAULT_QUOTAS_H_

#include "Quotas.h"

class DefaultQuotas : public Quotas
{
public:
    DefaultQuotas(
            const char * _root_elem,
            const char * _ds_xpath,
            const char * _net_xpath,
            const char * _img_xpath,
            const char * _vm_xpath):
        Quotas(_ds_xpath, _net_xpath, _img_xpath, _vm_xpath, true),
        root_elem(_root_elem)
    {};

    ~DefaultQuotas() {};

    /**
     *  Generates a string representation of the quotas in XML format
     *    @param xml the string to store the XML
     *    @return the same xml string to use it in << compounds
     */
    std::string& to_xml(std::string& xml) const;

    /**
     *  Writes the quotas in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert();

    /**
     *  Writes/updates the quotas data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update();

    /**
     *  Reads the Quotas from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select();

private:
    /**
     *  Name for the default quota attribute
     */
    const char * root_elem;

    /**
     *  Builds quota object from an ObjectXML
     *    @param xml The xml-formatted string
     *    @return 0 on success
     */
    int from_xml(const std::string& xml);
};

#endif /*DEFAULT_QUOTAS_H_*/
