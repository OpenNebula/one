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

#ifndef REQUEST_MANAGER_VDC_H
#define REQUEST_MANAGER_VDC_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcEditGroup : public Request
{
public:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

protected:
    VdcEditGroup(   const string& method_name,
                    const string& help,
                    const string& params,
                    bool          _check_obj_exist)
        :Request(method_name,params,help),
         check_obj_exist(_check_obj_exist)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        aclm        = nd.get_aclm();
        gpool      = nd.get_gpool();

        auth_object = PoolObjectSQL::VDC;
        auth_op     = AuthRequest::ADMIN;
    };

    GroupPool*   gpool;
    AclManager*  aclm;

    bool check_obj_exist;

    virtual int edit_group(
            Vdc* vdc, int group_id, string& error_msg) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddGroup : public VdcEditGroup
{
public:
    VdcAddGroup():
        VdcEditGroup(   "VdcAddGroup",
                        "Adds a group to the VDC",
                        "A:sii",
                        true){};

    ~VdcAddGroup(){};

    int edit_group(
            Vdc* vdc, int group_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelGroup : public VdcEditGroup
{
public:
    VdcDelGroup():
        VdcEditGroup(   "VdcDelGroup",
                        "Deletes a group from the VDC",
                        "A:sii",
                        false){};

    ~VdcDelGroup(){};

    int edit_group(
            Vdc* vdc, int group_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcEditResource : public Request
{
public:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

protected:
    VdcEditResource(const string& method_name,
                    const string& help,
                    const string& params,
                    bool          _check_obj_exist,
                    PoolSQL*      respool,
                    PoolObjectSQL::ObjectType res_obj_type)
        :Request(method_name,params,help),
         check_obj_exist(_check_obj_exist),
         respool(respool),
         res_obj_type(res_obj_type)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        zonepool    = nd.get_zonepool();

        local_zone_id = nd.get_zone_id();

        auth_object = PoolObjectSQL::VDC;
        auth_op     = AuthRequest::ADMIN;
    };

    bool check_obj_exist;
    int local_zone_id;

    ZonePool*   zonepool;
    PoolSQL*    respool;

    PoolObjectSQL::ObjectType res_obj_type;

    virtual int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddCluster : public VdcEditResource
{
public:
    VdcAddCluster():
        VdcEditResource("VdcAddCluster",
                          "Adds a cluster to the VDC",
                          "A:siii",
                          true,
                          Nebula::instance().get_clpool(),
                          PoolObjectSQL::CLUSTER){};

    ~VdcAddCluster(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelCluster : public VdcEditResource
{
public:
    VdcDelCluster():
        VdcEditResource("VdcDelCluster",
                          "Deletes a cluster from the VDC",
                          "A:siii",
                          false,
                          Nebula::instance().get_clpool(),
                          PoolObjectSQL::CLUSTER){};

    ~VdcDelCluster(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddHost : public VdcEditResource
{
public:
    VdcAddHost():
        VdcEditResource(  "VdcAddHost",
                          "Adds a host to the VDC",
                          "A:siii",
                          true,
                          Nebula::instance().get_hpool(),
                          PoolObjectSQL::HOST){};

    ~VdcAddHost(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelHost : public VdcEditResource
{
public:
    VdcDelHost():
        VdcEditResource(  "VdcDelHost",
                          "Deletes a host from the VDC",
                          "A:siii",
                          false,
                          Nebula::instance().get_hpool(),
                          PoolObjectSQL::HOST){};

    ~VdcDelHost(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddDatastore : public VdcEditResource
{
public:
    VdcAddDatastore():
        VdcEditResource(  "VdcAddDatastore",
                          "Adds a datastore to the VDC",
                          "A:siii",
                          true,
                          Nebula::instance().get_dspool(),
                          PoolObjectSQL::DATASTORE){};

    ~VdcAddDatastore(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelDatastore : public VdcEditResource
{
public:
    VdcDelDatastore():
        VdcEditResource(  "VdcDelDatastore",
                          "Deletes a datastore from the VDC",
                          "A:siii",
                          false,
                          Nebula::instance().get_dspool(),
                          PoolObjectSQL::DATASTORE){};

    ~VdcDelDatastore(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddVNet : public VdcEditResource
{
public:
    VdcAddVNet():
        VdcEditResource(  "VdcAddVNet",
                          "Adds a virtual network to the VDC",
                          "A:siii",
                          true,
                          Nebula::instance().get_vnpool(),
                          PoolObjectSQL::NET){};

    ~VdcAddVNet(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelVNet : public VdcEditResource
{
public:
    VdcDelVNet():
        VdcEditResource(  "VdcDelVNet",
                          "Deletes a virtual network from the VDC",
                          "A:siii",
                          false,
                          Nebula::instance().get_vnpool(),
                          PoolObjectSQL::NET){};

    ~VdcDelVNet(){};

    int edit_resource(
            Vdc* vdc, int zone_id, int res_id, string& error_msg);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


#endif
