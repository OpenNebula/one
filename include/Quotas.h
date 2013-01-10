/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             */
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

class ObjectXML;

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
     *  Different quota types
     */
    enum QuotaType {
        DATASTORE,      /**< Checks Datastore usage */
        VM,             /**< Checks VM usage (MEMORY, CPU and VMS) */
        NETWORK,        /**< Checks Network usage (leases) */
        IMAGE,          /**< Checks Image usage (RVMs using it) */
        VIRTUALMACHINE  /**< Checks all VM associated resources VM, NETWORK, IMAGE */
    };

    /**
     *  Set the quotas
     *    @param tmpl contains the user quota limits
     *    @param error describes error when setting the quotas
     *
     *    @return 0 on success, -1 otherwise
     */
    int set(Template *tmpl, string& error);

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
        datastore_quota.del(tmpl);
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
        return quota_check(VIRTUALMACHINE, tmpl, error_str);
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
     *  Check quota, it updates  usage counters if quotas are not exceeded.
     *    @param type the quota to work with
     *    @param tmpl template for the VirtualMachine
     *    @param error_str string describing the error
     *    @return true if VM can be allocated, false otherwise
     */
    bool quota_check(QuotaType type, Template *tmpl, string& error_str);

    /**
     *  Delete usage from the given quota counters.
     *    @param type the quota to work with
     *    @param tmpl template for the image, with usage
     */
    void quota_del(QuotaType type, Template *tmpl);

    /**
     *  Generates a string representation of the quotas in XML format
     *    @param xml the string to store the XML
     *    @return the same xml string to use it in << compounds
     */
    string& to_xml(string& xml) const;

    /**
     *  Builds quota object from an ObjectXML
     *    @param object_xml pointer to the ObjectXML 
     *    @return 0 if success
     */
    int from_xml(ObjectXML * object_xml);

    /**
     *  Delete VM related usage (network, image and compute) from quota counters.
     *  for the given user and group
     *    @param uid of the user
     *    @param gid of the group
     *    @param tmpl template for the image, with usage
     */
    static void vm_del(int uid, int gid, Template * tmpl)
    {
        quota_del(VIRTUALMACHINE, uid, gid, tmpl);
    }

    /**
     *  Delete Datastore related usage from quota counters.
     *  for the given user and group
     *    @param uid of the user
     *    @param gid of the group
     *    @param tmpl template for the image, with usage
     */
    static void ds_del(int uid, int gid, Template * tmpl)
    {
        quota_del(DATASTORE, uid, gid, tmpl);
    }

    /**
     *  Delete usage from the given quota counters.
     *  for the given user and group
     *    @param type the quota to work with
     *    @param uid of the user
     *    @param gid of the group
     *    @param tmpl template for the image, with usage
     */
    static void quota_del(QuotaType type, int uid, int gid, Template * tmpl);

private:
    //--------------------------------------------------------------------------
    // Usage Counters and Quotas 
    //--------------------------------------------------------------------------

    /**
     * Datastore Quotas 
     */     
     QuotaDatastore datastore_quota;

    /**
     * Network Quotas 
     */
     QuotaNetwork network_quota;

    /**
     * Image Quotas 
     */     
     QuotaImage image_quota;

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
