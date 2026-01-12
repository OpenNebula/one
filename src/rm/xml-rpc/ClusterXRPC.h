/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef CLUSTER_XRPC_H
#define CLUSTER_XRPC_H

#include "RequestXRPC.h"
#include "ClusterAPI.h"
#include "ClusterPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAllocateXRPC : public RequestXRPC, public ClusterAllocateAPI
{
public:
    ClusterAllocateXRPC() :
        RequestXRPC("one.cluster.allocate",
                    "Allocates a new Cluster",
                    "A:ssssi"),
        ClusterAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDeleteXRPC : public RequestXRPC, public ClusterAPI
{
public:
    ClusterDeleteXRPC() :
        RequestXRPC("one.cluster.delete",
                    "Deletes a Cluster",
                    "A:si"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterInfoXRPC : public RequestXRPC, public ClusterInfoAPI
{
public:
    ClusterInfoXRPC() :
        RequestXRPC("one.cluster.info",
                    "Returns Cluster information",
                    "A:sib"),
        ClusterInfoAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterUpdateXRPC : public RequestXRPC, public ClusterUpdateAPI
{
public:
    ClusterUpdateXRPC() :
        RequestXRPC("one.cluster.update",
                    "Updates a Cluster template",
                    "A:sisi"),
        ClusterUpdateAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterRenameXRPC : public RequestXRPC, public ClusterRenameAPI
{
public:
    ClusterRenameXRPC() :
        RequestXRPC("one.cluster.rename",
                    "Renames a Cluster",
                    "A:sis"),
        ClusterRenameAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddHostXRPC: public RequestXRPC, public ClusterAPI
{
public:
    ClusterAddHostXRPC()
        : RequestXRPC("one.cluster.addhost",
                      "Adds a host to the cluster",
                      "A:sii")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelHostXRPC : public RequestXRPC, public ClusterAPI
{
public:
    ClusterDelHostXRPC()
        : RequestXRPC("one.cluster.delhost",
                      "Deletes a host from its cluster",
                      "A:sii")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddDatastoreXRPC: public RequestXRPC, public ClusterAPI
{
public:
    ClusterAddDatastoreXRPC()
        : RequestXRPC("one.cluster.adddatastore",
                      "Adds a datastore to the cluster",
                      "A:sii")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelDatastoreXRPC : public RequestXRPC, public ClusterAPI
{
public:
    ClusterDelDatastoreXRPC()
        : RequestXRPC("one.cluster.deldatastore",
                      "Deletes a datastore from its cluster",
                      "A:sii")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddVNetXRPC: public RequestXRPC, public ClusterAPI
{
public:
    ClusterAddVNetXRPC()
        : RequestXRPC("one.cluster.addhost",
                      "Adds a virtual network to the cluster",
                      "A:sii")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelVNetXRPC : public RequestXRPC, public ClusterAPI
{
public:
    ClusterDelVNetXRPC()
        : RequestXRPC("one.cluster.delhost",
                      "Deletes a virtual network from its cluster",
                      "A:sii")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterOptimizeXRPC : public RequestXRPC, public ClusterAPI
{
public:
    ClusterOptimizeXRPC()
        : RequestXRPC("one.cluster.optimize",
                      "Create an optimization plan for Cluster",
                      "A:si")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPlanExecuteXRPC : public RequestXRPC, public ClusterAPI
{
public:
    ClusterPlanExecuteXRPC()
        : RequestXRPC("one.cluster.planexecute",
                      "Start execution of optimization plan",
                      "A:si")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPlanDeleteXRPC : public RequestXRPC, public ClusterAPI
{
public:
    ClusterPlanDeleteXRPC()
        : RequestXRPC("one.cluster.plandelete",
                      "Deletes an optimization plan",
                      "A:si")
        , ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPoolInfoXRPC : public RequestXRPC, public ClusterPoolAPI
{
public:
    ClusterPoolInfoXRPC()
        : RequestXRPC("one.clusterpool.info",
                      "Returns the Cluster pool",
                      "A:s")
        , ClusterPoolAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
