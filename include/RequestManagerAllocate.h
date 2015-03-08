/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef REQUEST_MANAGER_ALLOCATE_H_
#define REQUEST_MANAGER_ALLOCATE_H_

#include "Request.h"
#include "Nebula.h"

#include "VirtualNetworkTemplate.h"
#include "ImageTemplate.h"
#include "VirtualMachineTemplate.h"
#include "DatastoreTemplate.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerAllocate: public Request
{
protected:
    RequestManagerAllocate(const string& method_name,
                           const string& help,
                           const string& xml_args,
                           bool          _do_template)
        :Request(method_name,xml_args,help), do_template(_do_template)
    {
        auth_op = AuthRequest::CREATE;

        Nebula& nd  = Nebula::instance();
        clpool      = nd.get_clpool();
    };

    ~RequestManagerAllocate(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    virtual bool allocate_authorization(Template *          obj_template,
                                        RequestAttributes&  att,
                                        PoolObjectAuth *    cluster_perms);

    /* -------------------------------------------------------------------- */

    virtual Template * get_object_template() { return 0; };

    virtual int pool_allocate(xmlrpc_c::paramList const& _paramList,
                              Template * tmpl,
                              int& id,
                              string& error_str,
                              RequestAttributes& att)
    {
        return -1;
    };

    virtual int pool_allocate(xmlrpc_c::paramList const& _paramList,
                              Template * tmpl,
                              int& id,
                              string& error_str,
                              RequestAttributes& att,
                              int cluster_id,
                              const string& cluster_name)
    {
        return pool_allocate(_paramList, tmpl, id, error_str, att);
    };

    virtual int get_cluster_id(xmlrpc_c::paramList const&  paramList)
    {
        return ClusterPool::NONE_CLUSTER_ID;
    };

    virtual int add_to_cluster(
            Cluster* cluster,
            int id,
            Datastore::DatastoreType ds_type,
            string& error_msg)
    {
        return -1;
    };

    virtual Datastore::DatastoreType get_ds_type(int oid)
    {
        return Datastore::FILE_DS;
    };

protected:
    ClusterPool * clpool;

private:

    bool do_template;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAllocate: public RequestManagerAllocate
{
public:
    VirtualMachineAllocate():
        RequestManagerAllocate("VirtualMachineAllocate",
                               "Allocates a new virtual machine",
                               "A:ssb",
                               true)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template()
    {
        return new VirtualMachineTemplate;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);

    bool allocate_authorization(Template *          obj_template,
                                RequestAttributes&  att,
                                PoolObjectAuth *    cluster_perms);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAllocate: public RequestManagerAllocate
{
public:
    VirtualNetworkAllocate():
        RequestManagerAllocate("VirtualNetworkAllocate",
                               "Allocates a new virtual network",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template()
    {
        return new VirtualNetworkTemplate;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att,
                      int cluster_id,
                      const string& cluster_name);

    int get_cluster_id(xmlrpc_c::paramList const&  paramList)
    {
        return xmlrpc_c::value_int(paramList.getInt(2));
    };

    int add_to_cluster(
            Cluster* cluster,
            int id,
            Datastore::DatastoreType ds_type,
            string& error_msg)
    {
        return cluster->add_vnet(id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageAllocate: public RequestManagerAllocate
{
public:
    ImageAllocate():
        RequestManagerAllocate("ImageAllocate",
                               "Allocates a new image",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageAllocate(){};

    /* --------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateAllocate : public RequestManagerAllocate
{
public:
    TemplateAllocate():
        RequestManagerAllocate("TemplateAllocate",
                               "Allocates a new virtual machine template",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template()
    {
        return new VirtualMachineTemplate;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);

    bool allocate_authorization(Template *          obj_template,
                                RequestAttributes&  att,
                                PoolObjectAuth *    cluster_perms);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostAllocate : public RequestManagerAllocate
{
public:
    HostAllocate():
        RequestManagerAllocate("HostAllocate",
                               "Allocates a new host",
                               "A:sssssi",
                               false)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    ~HostAllocate(){};

    /* --------------------------------------------------------------------- */

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att,
                      int cluster_id,
                      const string& cluster_name);

    int get_cluster_id(xmlrpc_c::paramList const&  paramList)
    {
        return xmlrpc_c::value_int(paramList.getInt(5));
    };

    int add_to_cluster(
            Cluster* cluster,
            int id,
            Datastore::DatastoreType ds_type,
            string& error_msg)
    {
        return cluster->add_host(id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAllocate: public RequestManagerAllocate
{
public:
    UserAllocate():
        RequestManagerAllocate("UserAllocate",
                               "Returns user information",
                               "A:ssss",
                               false)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;

        hidden_params.insert(2); // password argument
    };

    ~UserAllocate(){};

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAllocate: public RequestManagerAllocate
{
public:
    GroupAllocate():
        RequestManagerAllocate("GroupAllocate",
                               "Allocates a new group",
                               "A:ss",
                               false)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = PoolObjectSQL::GROUP;

        vdcpool     = nd.get_vdcpool();
    };

    ~GroupAllocate(){};

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);

private:
    VdcPool * vdcpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreAllocate: public RequestManagerAllocate
{
public:
    DatastoreAllocate():
        RequestManagerAllocate("DatastoreAllocate",
                               "Allocates a new Datastore",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreAllocate(){};

    /* -------------------------------------------------------------------- */

    Template * get_object_template()
    {
        return new DatastoreTemplate;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att,
                      int cluster_id,
                      const string& cluster_name);

    int get_cluster_id(xmlrpc_c::paramList const&  paramList)
    {
        return xmlrpc_c::value_int(paramList.getInt(2));
    };

    virtual Datastore::DatastoreType get_ds_type(int oid)
    {
        Datastore::DatastoreType ds_type = Datastore::FILE_DS;
        Datastore *ds = static_cast<DatastorePool*>(pool)->get(oid, true);

        if ( ds != 0 )
        {
            ds_type = ds->get_type();
            ds->unlock();
        }

        return ds_type;
    };

    int add_to_cluster(
            Cluster* cluster,
            int id,
            Datastore::DatastoreType ds_type,
            string& error_msg)
    {
        return cluster->add_datastore(id, ds_type, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAllocate: public RequestManagerAllocate
{
public:
    ClusterAllocate():
        RequestManagerAllocate("ClusterAllocate",
                               "Allocates a new cluster",
                               "A:ss",
                               false)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterAllocate(){};

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentAllocate : public RequestManagerAllocate
{
public:
    DocumentAllocate():
        RequestManagerAllocate("DocumentAllocate",
                               "Allocates a new generic document",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template()
    {
        return new Template;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAllocate: public RequestManagerAllocate
{
public:
    ZoneAllocate():
        RequestManagerAllocate("ZoneAllocate",
                               "Allocates a new zone",
                               "A:ss",
                               true)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
    };

    ~ZoneAllocate(){};

    /* --------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    Template * get_object_template()
    {
        return new Template;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupAllocate : public RequestManagerAllocate
{
public:
    SecurityGroupAllocate():
        RequestManagerAllocate("SecurityGroupAllocate",
                               "Allocates a new security group",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template()
    {
        return new Template;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAllocate : public RequestManagerAllocate
{
public:
    VdcAllocate():
        RequestManagerAllocate("VdcAllocate",
                               "Allocates a new VDC",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
    };

    ~VdcAllocate(){};

    /* --------------------------------------------------------------------- */

    Template * get_object_template()
    {
        return new Template;
    };

    int pool_allocate(xmlrpc_c::paramList const& _paramList,
                      Template * tmpl,
                      int& id,
                      string& error_str,
                      RequestAttributes& att);
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
