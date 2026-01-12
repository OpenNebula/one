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

#ifndef SHARED_API_H_
#define SHARED_API_H_

#include "Request.h"
#include "Nebula.h"
#include "PoolObjectSQL.h"

class Cluster;
class DefaultQuotas;

/* Shared API calls, specific code is called through virtual methods
 */
class SharedAPI
{
public:
    /**
     *  Performs a basic authorization for this request using the uid/gid
     *  from the request. The function gets the object from the pool to get
     *  the public attribute and its owner. The authorization is based on
     *  object and type of operation for the request.
     *    @param pool object pool
     *    @param oid of the object, can be -1 for objects to be created, or
     *    pools.
     *    @param att the specific request attributes
     *
     *    @return SUCCESS if the user is authorized.
     */
    static Request::ErrorCode basic_authorization(
            PoolSQL*                pool,
            int                     oid,
            PoolObjectSQL::ObjectType auth_object,
            RequestAttributes&      att);

    virtual Request::ErrorCode chmod(int oid,
                                     int owner_u, int owner_m, int owner_a,
                                     int group_u, int group_m, int group_a,
                                     int other_u, int other_m, int other_a,
                                     RequestAttributes& att);

protected:
    SharedAPI(Request& r)
        : request(r)
    {}

    virtual ~SharedAPI() = default;

    /*************************************************************************/
    /* API calls                                                             */
    /*************************************************************************/

    virtual Request::ErrorCode allocate(const std::string& str_tmpl,
                                        int cluster_id,
                                        int& oid,
                                        RequestAttributes& att);

    Request::ErrorCode del(int oid,
                           bool recursive,
                           RequestAttributes& att);

    Request::ErrorCode info(int oid,
                            bool decrypt,
                            std::string& xml,
                            RequestAttributes& att);

    virtual Request::ErrorCode update(int oid,
                                      const std::string& tmpl,
                                      int update_type,
                                      RequestAttributes& att);

    Request::ErrorCode rename(int oid,
                              const std::string& new_name,
                              RequestAttributes& att);

    Request::ErrorCode quota_update(std::string& quota,
                                    RequestAttributes& att);

    virtual Request::ErrorCode chown(int oid,
                                     int new_uid,
                                     int new_gid,
                                     RequestAttributes& att);

    Request::ErrorCode lock(int oid,
                            int level,
                            bool test,
                            RequestAttributes& att);

    Request::ErrorCode unlock(int oid, RequestAttributes& att);

    Request::ErrorCode clone(int source_id,
                             const std::string &name,
                             bool recursive,
                             const std::string& s_uattr,
                             int &new_id,
                             RequestAttributes& att);

    Request::ErrorCode update_db(int oid,
                                 const std::string& xml,
                                 RequestAttributes& att);

    Request::ErrorCode allocate_db(int& oid,
                                   const std::string& xml,
                                   RequestAttributes& att);

    Request::ErrorCode drop_db(int oid,
                               RequestAttributes& att);

    /*************************************************************************/
    /* Static helper methods                                                 */
    /*************************************************************************/
    /**
     *  Performs a basic authorization for this request using the uid/gid
     *  from the request. The function gets the object from the pool to get
     *  the public attribute and its owner. The authorization is based on
     *  object and type of operation for the request.
     *    @param oid of the object, can be -1 for objects to be created, or
     *    pools.
     *    @param att the specific request attributes
     *
     *    @return error code
     */
    Request::ErrorCode basic_authorization(int oid, RequestAttributes& att);

    /**
     *  Performs a basic quota check for this request using the uid/gid
     *  from the request. Usage counters are updated for the user/group.
     *  On case of error, the reason is returned in error_str
     *
     *    @param tmpl describing the object
     *    @param object type of the object
     *    @param att the specific request attributes
     *    @param resize update quota for resize operation, which may reduce quota usage
     *
     *    @param error_str Error reason, if any
     *    @return true if the user is authorized.
     */
    static bool quota_authorization(Template * tmpl, Quotas::QuotaType qtype,
                                    const RequestAttributes& att, std::string& error_str,
                                    bool resize = false);

    /**
     *  Performs rollback on usage counters for a previous  quota check operation
     *  for the request.
     *    @param tmpl describing the object
     *    @param att the specific request attributes
     */
    static void quota_rollback(Template * tmpl, Quotas::QuotaType qtype,
                               const RequestAttributes& att);

    /**
     * Get the requested object, read basic information
     *
     * @param pool object pool
     * @param id of the object
     * @param type of the object
     * @param att the specific request attributes
     *
     * @param perms returns the object's permissions
     * @param name returns the object's name
     * @param throw_error send error response to client if object not found
     *
     * @return 0 on success, -1 otherwise
     */
    static int get_info(PoolSQL *                 pool,
                        int                       id,
                        PoolObjectSQL::ObjectType type,
                        RequestAttributes&        att,
                        PoolObjectAuth&           perms,
                        std::string&              name,
                        bool                      throw_error);

    /**
     *    @param tmpl describing the object
     *    @param att the specific request attributes
     */
    static Request::ErrorCode as_uid_gid(Template * tmpl, RequestAttributes& att);

    /*************************************************************************/
    /* Virtual helpers, override in derived classes                          */
    /*************************************************************************/

    /**
     *  Returns empty resource Template, used by allocate
     */
    virtual std::unique_ptr<Template> get_object_template() const
    {
        return nullptr;
    }

    /**
     *  Authorization for allocate requests, used by allocate
     *    @param obj_template to be allocated
     *    @param att request attributes
     *    @param cluster_perms permissions for the cluster, if any
     *    @return error code
     */
    virtual Request::ErrorCode allocate_authorization(Template *obj_template,
                                                      RequestAttributes&  att,
                                                      PoolObjectAuth *cluster_perms);

    /*
     *  Function to allocate an object in the pool, used by allocate
     *    @param tmpl describing the object
     *    @param id assigned to the object
     *    @param att request attributes
     *    @return SUCCESS if the allocation was successful
     */
    virtual Request::ErrorCode pool_allocate(
            std::unique_ptr<Template> tmpl,
            int& id,
            RequestAttributes& att)
    {
        att.resp_msg = "pool_allocate not implemented";
        return Request::ALLOCATE;
    }

    /*
     *  Function to allocate an object in the pool, used by clone
     */
    virtual Request::ErrorCode pool_allocate(
            int sid,
            std::unique_ptr<Template> tmpl,
            int& id,
            RequestAttributes& att)
    {
        return pool_allocate(std::move(tmpl), id, att);
    }


    /**
     *  Function to allocate an object and add it to a cluster, used by allocate
     *    @param cluster to which the object will be added
     *    @param id of the object
     *    @param error_msg error message in case of failure
     *    @return 0 on success, -1 otherwise
     */
    virtual Request::ErrorCode pool_allocate(
            std::unique_ptr<Template> tmpl,
            int& id,
            RequestAttributes& att,
            int cluster_id,
            const std::string& cluster_name)
    {
        return pool_allocate(std::move(tmpl), id, att);
    }

    /**
     *  Function to add an object to a cluster, used by allocate
     */
    virtual int add_to_cluster(
            Cluster* cluster,
            int oid,
            std::string& error_msg)
    {
        return -1;
    }

    /* Authorize, drop object and delete ACL rules, used by delete */
    Request::ErrorCode delete_object(int oid,
                                     bool recursive,
                                     RequestAttributes& att);

    /* Delete object from pool, remove it from clusters, used by delete */
    virtual int drop(std::unique_ptr<PoolObjectSQL> obj,
                     bool recursive,
                     RequestAttributes& att);

    /* Get cluster ids for an object, used by delete */
    virtual std::set<int> get_cluster_ids(PoolObjectSQL * object) const
    {
        return std::set<int>();
    }

    /* Delete object from cluster, used by delete */
    virtual int del_from_cluster(Cluster* cluster, int id, std::string& error_msg)
    {
        return -1;
    }

    /* Export object to XML, used by info */
    virtual void to_xml(RequestAttributes& att,
                        PoolObjectSQL * object,
                        std::string& str)
    {
        object->to_xml(str);
    }

    /* Load extended data for an object, used by info */
    virtual void load_extended_data(PoolObjectSQL *obj) const
    {
    }

    /**
     *  Method for updating custom values not included in PoolSQL::update
     *  mainly used for updating search information in the VMs.
     *    @param obj to be updated
     *    @return 0 on success
     */
    virtual int extra_updates(PoolObjectSQL * obj)
    {
        return 0;
    }

    /**
     *  Check if an object exists by name and owner, used by rename
     */
    virtual int exist(const std::string& name, int uid)
    {
        return pool->exist(name, uid);
    }

    /**
     *  Batch rename of related objects, used by rename
     */
    virtual void batch_rename(int oid) {};

    /**
     *  Test if a rename is being perform on a given object. If not it set it.
     *    @return true if the rename can be performed (no ongoing rename)
     */
    bool test_and_set_rename(int oid)
    {
        std::lock_guard<std::mutex> lock(_mutex);

        auto rc = rename_ids.insert(oid);

        return rc.second == true;
    }

    /**
     *  Clear the rename.
     */
    void clear_rename(int oid)
    {
        std::lock_guard<std::mutex> lock(_mutex);

        rename_ids.erase(oid);
    }

    /**
     *  Struct for get_and_quota
     */
    struct QuotaResult {
        std::unique_ptr<PoolObjectSQL> obj;
        Request::ErrorCode             ec;
    };

    /**
     *  Get an object and its quota
     */
    QuotaResult get_and_quota(int                       oid,
                              int                       new_uid,
                              int                       new_gid,
                              RequestAttributes&        att,
                              PoolSQL *                 pool,
                              PoolObjectSQL::ObjectType auth_object);

    /**
     *  Get an object and its quota
     */
    QuotaResult get_and_quota(int                       oid,
                              int                       new_uid,
                              int                       new_gid,
                              RequestAttributes&        att)
    {
        return get_and_quota(oid, new_uid, new_gid, att, pool, request.auth_object());
    }

    /**
     *  Check if a name is unique
     */
    virtual Request::ErrorCode check_name_unique(int oid,
                                                 int new_uid,
                                                 RequestAttributes& att);


    /**
     *  Set the default quota for a template
     */
    virtual int set_default_quota(Template *tmpl, RequestAttributes& att)
    {
        return 0;
    }

    /**
     *  Get the default quota for a template
     */
    const virtual DefaultQuotas* get_default_quota()
    {
        return 0;
    }

    /**
     *  Return clone of the object template
     */
    virtual std::unique_ptr<Template> clone_template(PoolObjectSQL* obj)
    {
        return nullptr;
    }

    /**
     *  Function to merge user/additional attributes in the cloned object
     */
    virtual Request::ErrorCode merge(Template * tmpl,
                                     const std::string &str_uattrs,
                                     RequestAttributes& att)
    {
        return Request::SUCCESS;
    }

    /**
     *  Create a PoolObjectSQL from XML
     */
    virtual PoolObjectSQL* create(const std::string& xml)
    {
        return nullptr;
    }

    Request& request;

    PoolSQL     *pool   = nullptr;

private:
    /* ---------------------------------------------------------------------- */
    /* Functions to manage user and group quotas                              */
    /* ---------------------------------------------------------------------- */
    static bool user_quota_authorization(Template * tmpl,
                                         Quotas::QuotaType qtype,
                                         bool resize,
                                         const RequestAttributes& att,
                                         std::string& error_str);

    static bool group_quota_authorization(Template * tmpl,
                                          Quotas::QuotaType qtype,
                                          bool resize,
                                          const RequestAttributes& att,
                                          std::string& error_str);

    static void user_quota_rollback(Template * tmpl,
                                    Quotas::QuotaType qtype,
                                    const RequestAttributes& att);

    static void group_quota_rollback(Template * tmpl,
                                     Quotas::QuotaType qtype,
                                     const RequestAttributes& att);

    /**
     *  Mutex for locking the rename_ids set
     */
    std::mutex _mutex;

    /**
     *  Set of ids of objects that are being renamed
     */
    std::set<int> rename_ids;
};

#endif
