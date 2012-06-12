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

#ifndef QUOTAS_H_
#define QUOTAS_H_

#include "QuotaDatastore.h"
#include "QuotaNetwork.h"
#include "QuotaVirtualMachine.h"
#include "QuotaImage.h"

class Quotas
{
public:
    Quotas(const char * _ds_xpath,
           const char * _net_xpath,
           const char * _img_xpath,
           const char * _vm_xpath): 
                ds_xpath(_ds_xpath),
                net_xpath(_net_xpath),
                img_xpath(_img_xpath),
                vm_xpath(_vm_xpath)
    {};

    virtual ~Quotas(){};

    /**
     *  Set the quotas
     *    @param tmpl contains the user quota limits
     *    @param error describes error when setting the quotas
     *
     *    @return 0 on success, -1 otherwise
     */
    int set(Template *tmpl, string& error)
    {
        vector<Attribute *> vquotas;

        if ( tmpl->get(datastore_quota.get_quota_name(), vquotas) > 0 )
        {
            if ( datastore_quota.set(&vquotas, error) != 0 )
            {
                return -1;
            }
        
            vquotas.clear();
        }

        if ( tmpl->get(network_quota.get_quota_name(), vquotas) > 0 )
        {
            if ( network_quota.set(&vquotas, error) != 0 )
            {
                return -1;
            }
        
            vquotas.clear();
        }

        if ( tmpl->get(image_quota.get_quota_name(), vquotas) > 0 )
        {
            if ( image_quota.set(&vquotas, error) != 0 )
            {
                return -1;
            }
        
            vquotas.clear();
        }

        if ( tmpl->get(vm_quota.get_quota_name(), vquotas) > 0 )
        {
            if ( vm_quota.set(&vquotas, error) != 0 )
            {
                return -1;
            }
        
            vquotas.clear();
        }

        return 0;
    }

    /**
     *  Check Datastore quotas, it updates usage counters if quotas are not 
     *  exceeded.
     *    @param tmpl template for the image
     *    @param reason string describing the error
     *    @return true if image can be allocated, false otherwise
     */
     bool ds_check(Template * tmpl, string& reason)
     {
        return datastore_quota.check(tmpl, reason);
     }

    /**
     *  Delete usage from quota counters.
     *    @param tmpl template for the image, with usage
     */
     void ds_del(Template * tmpl)
     {
        return datastore_quota.del(tmpl);
     }

    /**
     *  Check Virtual Machine quotas (network, image and compute), it updates 
     *  usage counters if quotas are not exceeded.
     *    @param tmpl template for the VirtualMachine
     *    @param error_str string describing the error
     *    @return true if VM can be allocated, false otherwise
     */
     bool vm_check(Template * tmpl, string& error_str)
     {

        if ( network_quota.check(tmpl, error_str) == false )
        {
            return false;
        }

        if ( vm_quota.check(tmpl, error_str) == false )
        {
            network_quota.del(tmpl);
            return false;
        }

        if ( image_quota.check(tmpl, error_str) == false )
        {
            network_quota.del(tmpl);
            vm_quota.del(tmpl);
            return false;
        }

        return true;
     }

    /**
     *  Delete VM related usage (network, image and compute) from quota counters.
     *    @param tmpl template for the image, with usage
     */
     void vm_del(Template * tmpl)
     {
        network_quota.del(tmpl);
        vm_quota.del(tmpl);
        image_quota.del(tmpl);
     }

    /**
     *  Generates a string representation of the quotas in XML format
     *    @param xml the string to store the XML
     *    @return the same xml string to use it in << compounds
     */
    string& to_xml(string& xml) const
    {
        ostringstream oss;

        string ds_quota_xml;
        string net_quota_xml;
        string vm_quota_xml;
        string image_quota_xml;

        oss << datastore_quota.to_xml(ds_quota_xml)
            << network_quota.to_xml(net_quota_xml)
            << vm_quota.to_xml(vm_quota_xml)
            << image_quota.to_xml(image_quota_xml);

        xml = oss.str();

        return xml;
    }

    /**
     *  Builds quota object from an ObjectXML
     *    @param object_xml pointer to the ObjectXML 
     *    @return 0 if success
     */
    int from_xml(ObjectXML * object_xml)
    {
        vector<xmlNodePtr> content;
        int                rc = 0;

        object_xml->get_nodes(ds_xpath, content);

        if (!content.empty())
        {
            rc += datastore_quota.from_xml_node(content[0]);
        }

        object_xml->free_nodes(content);
        content.clear();

        object_xml->get_nodes(net_xpath, content);

        if (!content.empty())
        {
            rc += network_quota.from_xml_node(content[0]);
        }

        object_xml->free_nodes(content);
        content.clear();

        object_xml->get_nodes(vm_xpath, content);

        if (!content.empty())
        {
            rc += vm_quota.from_xml_node(content[0]);
        }

        object_xml->free_nodes(content);
        content.clear();

        object_xml->get_nodes(img_xpath, content);

        if (!content.empty())
        {
            rc += image_quota.from_xml_node(content[0]);
        }

        object_xml->free_nodes(content);

        return rc;
    }

private:
    //--------------------------------------------------------------------------
    // Usage Counters and Quotas 
    //--------------------------------------------------------------------------

    /**
     * Datastore Quotas 
     */     
     QuotaDatastore      datastore_quota;

    /**
     * Network Quotas 
     */
     QuotaNetwork        network_quota;

    /**
     * Image Quotas 
     */     
     QuotaImage          image_quota;

    /**
     * Virtual Machine Quotas 
     */     
     QuotaVirtualMachine vm_quota;

    //--------------------------------------------------------------------------
    // XPaths
    //--------------------------------------------------------------------------

    /**
     *  Path for the datastore quota object
     */
    const char * ds_xpath;

    /**
     *  Path for the network quota object
     */
    const char * net_xpath;

    /**
     * Path for the image quota object
     */
    const char * img_xpath;

    /**
     * Path for the vm quota object
     */
    const char * vm_xpath;

};

#endif /*QUOTABLE_H_*/
