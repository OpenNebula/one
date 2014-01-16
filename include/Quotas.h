/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include "ObjectSQL.h"

class ObjectXML;

class Quotas : public ObjectSQL
{
public:
    Quotas(const char * _ds_xpath,
           const char * _net_xpath,
           const char * _img_xpath,
           const char * _vm_xpath):
                datastore_quota(false),
                network_quota(false),
                image_quota(false),
                vm_quota(false),
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
     *  Delete usage from quota counters.
     *    @param tmpl template for the image, with usage
     */
     void ds_del(Template * tmpl)
     {
        datastore_quota.del(tmpl);
     }

     /**
      * Gets a Datastore quota identified by its ID.
      *
      *    @param id of the quota
      *    @param va The quota, if it is found
      *
      *    @return 0 on success, -1 if not found
      */
     int ds_get(const string& id, VectorAttribute **va)
     {
         return datastore_quota.get_quota(id, va);
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
      * Gets a VM quota identified by its ID.
      *
      *    @param id of the quota
      *    @param va The quota, if it is found
      *
      *    @return 0 on success, -1 if not found
      */
     int vm_get(const string& id, VectorAttribute **va)
     {
         return vm_quota.get_quota(id, va);
     }

     /**
      * Gets a Network quota identified by its ID.
      *
      *    @param id of the quota
      *    @param va The quota, if it is found
      *
      *    @return 0 on success, -1 if not found
      */
     int network_get(const string& id, VectorAttribute **va)
     {
         return network_quota.get_quota(id, va);
     }

     /**
      * Gets an Image quota identified by its ID.
      *
      *    @param id of the quota
      *    @param va The quota, if it is found
      *
      *    @return 0 on success, -1 if not found
      */
     int image_get(const string& id, VectorAttribute **va)
     {
         return image_quota.get_quota(id, va);
     }

    /**
     *  Check quota, it updates  usage counters if quotas are not exceeded.
     *    @param type the quota to work with
     *    @param tmpl template for the VirtualMachine
     *    @param default_quotas Quotas that contain the default limits
     *    @param error_str string describing the error
     *    @return true if resource can be allocated, false otherwise
     */
     bool quota_check(QuotaType type,
                     Template *tmpl,
                     Quotas& default_quotas,
                     string& error_str);

    /**
     *  Update usage of an existing quota (e.g. size of an image), it updates
     *  the usage counters if quotas are not exceeded.
     *    @param type the quota to work with
     *    @param tmpl template for the VirtualMachine
     *    @param default_quotas Quotas that contain the default limits
     *    @param error_str string describing the error
     *    @return true if resource can be updated, false otherwise
     */
     bool quota_update(QuotaType type,
                       Template *tmpl,
                       Quotas& default_quotas,
                       string& error_str);

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
     *  Generates a string representation of the quotas in XML format, enclosed
     *  in the QUOTAS tag
     *    @param xml the string to store the XML
     *    @return the same xml string to use it in << compounds
     */
    string& to_xml_db(string& xml) const;

    /**
     *  Builds quota object from an ObjectXML
     *    @param object_xml pointer to the ObjectXML
     *    @return 0 if success
     */
    int from_xml(ObjectXML * object_xml);

    // TODO: remove previous method, leave this one only
    int from_xml(const string& xml);

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


    //--------------------------------------------------------------------------
    // Database
    //--------------------------------------------------------------------------

    /**
     *  Reads the ObjectSQL (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db);

    /**
     *  Writes the Quotas in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str)
    {
        return insert_replace(db, false, error_str);
    };

    /**
     *  Writes/updates the Quotas fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Removes the Quotas from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB * db);

    /**
     * User/Group oid. Must be set before a DB write operation
     */
    int oid;

protected:
    /**
     *  This is an specialized constructor only for derived Quotas classes.
     *  It allows to set the defaultness attribute
     */
    Quotas(const char * _ds_xpath,
           const char * _net_xpath,
           const char * _img_xpath,
           const char * _vm_xpath,
           bool         is_deafult):
                oid(-1),
                datastore_quota(is_deafult),
                network_quota(is_deafult),
                image_quota(is_deafult),
                vm_quota(is_deafult),
                ds_xpath(_ds_xpath),
                net_xpath(_net_xpath),
                img_xpath(_img_xpath),
                vm_xpath(_vm_xpath)
    {};

    virtual const char * table() const
    {
        return 0;
    };

    virtual const char * table_names() const
    {
        return 0;
    };

    virtual const char * table_oid_column() const
    {
        return 0;
    };

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

    //--------------------------------------------------------------------------
    // Database
    //--------------------------------------------------------------------------

    /**
     *  Callback function to read a Quotas object (Quotas::select)
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);
};

#endif /*QUOTABLE_H_*/
