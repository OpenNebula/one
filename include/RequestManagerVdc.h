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

#ifndef REQUEST_MANAGER_VDC_H
#define REQUEST_MANAGER_VDC_H

#include "Request.h"
#include "Nebula.h"
#include "ClusterPool.h"
#include "DatastorePool.h"
#include "HostPool.h"
#include "VdcPool.h"
#include "VirtualNetworkPool.h"
#include "ZonePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcEditGroup : public Request
{
public:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

protected:
    VdcEditGroup(const std::string& method_name,
                 const std::string& help,
                 const std::string& params,
                 bool          _check_obj_exist)
        :Request(method_name, params, help),
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
            Vdc* vdc, int group_id, std::string& error_msg) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddGroup : public VdcEditGroup
{
public:
    VdcAddGroup():VdcEditGroup("one.vdc.addgroup", "Adds a group to the VDC",
                                   "A:sii", true) {};

    ~VdcAddGroup() = default;

    int edit_group(
            Vdc* vdc, int group_id, std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelGroup : public VdcEditGroup
{
public:
    VdcDelGroup():VdcEditGroup("one.vdc.delgroup", "Deletes a group from the VDC",
                                   "A:sii", false) {};

    ~VdcDelGroup() = default;

    int edit_group(
            Vdc* vdc, int group_id, std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcEditResource : public Request
{
public:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

protected:
    VdcEditResource(const std::string& method_name,
                    const std::string& help,
                    const std::string& params,
                    bool               _check_obj_exist,
                    PoolSQL*           respool,
                    PoolObjectSQL::ObjectType res_obj_type)
        :Request(method_name, params, help),
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

    virtual int edit_resource(Vdc* vdc, int zone_id, int res_id,
                              std::string& error_msg) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddCluster : public VdcEditResource
{
public:
    VdcAddCluster():VdcEditResource("one.vdc.addcluster",
                                        "Adds a cluster to the VDC", "A:siii", true,
                                        Nebula::instance().get_clpool(), PoolObjectSQL::CLUSTER) {};

    ~VdcAddCluster() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelCluster : public VdcEditResource
{
public:
    VdcDelCluster():VdcEditResource("one.vdc.delcluster",
                                        "Deletes a cluster from the VDC", "A:siii", false,
                                        Nebula::instance().get_clpool(), PoolObjectSQL::CLUSTER) {};

    ~VdcDelCluster() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddHost : public VdcEditResource
{
public:
    VdcAddHost(): VdcEditResource("one.vdc.addhost", "Adds a host to the VDC",
                                      "A:siii", true, Nebula::instance().get_hpool(), PoolObjectSQL::HOST) {};

    ~VdcAddHost() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelHost : public VdcEditResource
{
public:
    VdcDelHost():VdcEditResource("one.vdc.delhost", "Deletes a host from the VDC",
                                     "A:siii", false, Nebula::instance().get_hpool(), PoolObjectSQL::HOST) {};

    ~VdcDelHost() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddDatastore : public VdcEditResource
{
public:
    VdcAddDatastore():VdcEditResource("one.vdc.adddatastore",
                                          "Adds a datastore to the VDC", "A:siii", true,
                                          Nebula::instance().get_dspool(), PoolObjectSQL::DATASTORE) {};

    ~VdcAddDatastore() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelDatastore : public VdcEditResource
{
public:
    VdcDelDatastore():VdcEditResource("one.vdc.deldatastore",
                                          "Deletes a datastore from the VDC", "A:siii", false,
                                          Nebula::instance().get_dspool(), PoolObjectSQL::DATASTORE) {};

    ~VdcDelDatastore() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddVNet : public VdcEditResource
{
public:
    VdcAddVNet():VdcEditResource("one.vdc.addvnet",
                                     "Adds a virtual network to the VDC", "A:siii", true,
                                     Nebula::instance().get_vnpool(), PoolObjectSQL::NET) {};

    ~VdcAddVNet() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelVNet : public VdcEditResource
{
public:
    VdcDelVNet(): VdcEditResource("one.vdc.delvnet",
                                      "Deletes a virtual network from the VDC", "A:siii", false,
                                      Nebula::instance().get_vnpool(), PoolObjectSQL::NET) {};

    ~VdcDelVNet() = default;

    int edit_resource(Vdc* vdc, int zone_id, int res_id,
                      std::string& error_msg) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
