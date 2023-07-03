/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef NEBULA_H_
#define NEBULA_H_

#include "NebulaService.h"
#include "OpenNebulaTemplate.h"
#include "SystemDB.h"

#include "DefaultQuotas.h"
#include "UserPool.h"
#include "Zone.h"

class LogDB;
class FedLogDB;
class User;

class BackupJobPool;
class ClusterPool;
class DatastorePool;
class DocumentPool;
class GroupPool;
class HookPool;
class HostPool;
class ImagePool;
class MarketPlacePool;
class MarketPlaceAppPool;
class ScheduledActionPool;
class SecurityGroupPool;
class VdcPool;
class VMGroupPool;
class VMTemplatePool;
class VNTemplatePool;
class VirtualMachinePool;
class VirtualNetworkPool;
class VirtualRouterPool;
class ZonePool;

class AclManager;
class AuthManager;
class DispatchManager;
class FedReplicaManager;
class HookLog;
class HookManager;
class ImageManager;
class InformationManager;
class IPAMManager;
class LifeCycleManager;
class MarketPlaceManager;
class RaftManager;
class RequestManager;
class ScheduledActionManager;
class TransferManager;
class VirtualMachineManager;

/**
 *  This is the main class for the OpenNebula daemon oned. It stores references
 *  to the main modules and data pools. It also includes functions to bootstrap
 *  the system and start all its components.
 */
class Nebula : public NebulaService
{
public:

    static Nebula& instance()
    {
        return static_cast<Nebula&>(NebulaService::instance());
    };

    // --------------------------------------------------------------
    // Pool Accessors
    // --------------------------------------------------------------
    LogDB * get_logdb() const
    {
        return logdb;
    };

    VirtualMachinePool * get_vmpool() const
    {
        return vmpool;
    };

    HostPool * get_hpool() const
    {
        return hpool;
    };

    VirtualNetworkPool * get_vnpool() const
    {
        return vnpool;
    };

    UserPool * get_upool() const
    {
        return upool;
    };

    ImagePool * get_ipool() const
    {
        return ipool;
    };

    GroupPool * get_gpool() const
    {
        return gpool;
    };

    VMTemplatePool * get_tpool() const
    {
        return tpool;
    };

    DatastorePool * get_dspool() const
    {
        return dspool;
    };

    ClusterPool * get_clpool() const
    {
        return clpool;
    };

    DocumentPool * get_docpool() const
    {
        return docpool;
    };

    ZonePool * get_zonepool() const
    {
        return zonepool;
    };

    SecurityGroupPool * get_secgrouppool() const
    {
        return secgrouppool;
    };

    VdcPool * get_vdcpool() const
    {
        return vdcpool;
    };

    VirtualRouterPool * get_vrouterpool() const
    {
        return vrouterpool;
    };

    MarketPlacePool * get_marketpool() const
    {
        return marketpool;
    };

    MarketPlaceAppPool * get_apppool() const
    {
        return apppool;
    };

    VMGroupPool * get_vmgrouppool() const
    {
        return vmgrouppool;
    };

    VNTemplatePool * get_vntpool() const
    {
        return vntpool;
    }

    HookPool * get_hkpool() const
    {
        return hkpool;
    }

    BackupJobPool * get_bjpool() const
    {
        return bjpool;
    }

    ScheduledActionPool * get_sapool() const
    {
        return sapool;
    }

    // --------------------------------------------------------------
    // Manager Accessors
    // --------------------------------------------------------------

    VirtualMachineManager * get_vmm() const
    {
        return vmm;
    };

    LifeCycleManager * get_lcm() const
    {
        return lcm;
    };

    InformationManager * get_im() const
    {
        return im;
    };

    TransferManager * get_tm() const
    {
        return tm;
    };

    DispatchManager * get_dm() const
    {
        return dm;
    };

    HookManager * get_hm() const
    {
        return hm;
    };

    HookLog * get_hl() const
    {
        return hl;
    };

    AuthManager * get_authm() const
    {
        return authm;
    };

    ImageManager * get_imagem() const
    {
        return imagem;
    };

    AclManager * get_aclm() const
    {
        return aclm;
    };

    MarketPlaceManager * get_marketm() const
    {
        return marketm;
    };

    IPAMManager * get_ipamm() const
    {
        return ipamm;
    };

    RaftManager * get_raftm() const
    {
        return raftm;
    };

    FedReplicaManager * get_frm() const
    {
        return frm;
    };

    RequestManager * get_rm() const
    {
        return rm;
    };

    ScheduledActionManager * get_sam() const
    {
        return sam;
    }

    // --------------------------------------------------------------
    // Environment & Configuration
    // --------------------------------------------------------------

    /**
     *
     *
     */
    void get_ds_location(std::string& dsloc) const;

    /**
     *  Returns the path of the log file for a VM, depending where OpenNebula is
     *  installed,
     *     $ONE_LOCATION/var/$VM_ID/vm.log
     *  or
     *     /var/log/one/$VM_ID.log
     *  @return the log location for the VM.
     */
    std::string get_vm_log_filename(int oid) const;

    /**
     *  Returns the name of the host running oned
     *    @return the name
     */
    const std::string& get_nebula_hostname() const
    {
        return hostname;
    };

    /**
     *  Starts all the modules and services for OpenNebula
     */
    void start(bool bootstrap_only=false);

    /**
     *  Initialize the database
     */
    void bootstrap_db()
    {
        start(true);
    }

    // --------------------------------------------------------------
    // Federation
    // --------------------------------------------------------------

    bool is_federation_enabled()
    {
        return federation_enabled;
    };

    bool is_federation_master()
    {
        return federation_master;

    };

    bool is_federation_slave()
    {
        return federation_enabled && !federation_master;
    };

    bool is_cache()
    {
        return cache;
    };

    int get_zone_id() const
    {
        return zone_id;
    };

    int get_server_id() const
    {
        return server_id;
    };

    const std::string& get_master_oned() const
    {
        return master_oned;
    };

    void set_zone_state(Zone::ZoneState state)
    {
        zone_state = state;
    }

    Zone::ZoneState get_zone_state() const
    {
        return zone_state;
    }

    /**
     * Update actual zone state from the DB
     */
    void update_zone_state();

    // -----------------------------------------------------------------------
    // Configuration attributes (read from oned.conf)
    // -----------------------------------------------------------------------
    /**
     *  Gets a configuration attribute for oned
     *    @param name of the attribute
     *    @param value of the attribute
     */
    template<typename T>
    void get_configuration_attribute(const std::string& name, T& value) const
    {
        config->get(name, value);
    };

    /**
     *  Gets a user-configurable attribute for oned. Users (and groups) may
     *  store oned attributes in the "OPENNEBULA" vector. This function gets
     *  the value querying first the user, then the group and finally oned.conf
     *    @param uid of the user, if -1 the user template is not considered
     *    @param gid of the group
     *    @param name of the attribute
     *    @param value of the attribute
     *
     *    @return 0 on success -1 otherwise
     */
    template<typename T>
    int get_configuration_attribute(int uid, int gid, const std::string& name,
            T& value) const
    {
        if ( uid != -1 )
        {
            auto user = upool->get_ro(uid);

            if (!user)
            {
                return -1;
            }

            auto uconf = user->get_template_attribute("OPENNEBULA");

            if ( uconf != nullptr )
            {
                if ( uconf->vector_value(name, value) == 0 )
                {
                    return 0;
                }
            }
        }

        auto group = gpool->get_ro(gid);

        if (!group)
        {
            return -1;
        }

        auto gconf = group->get_template_attribute("OPENNEBULA");

        if ( gconf != nullptr )
        {
            if ( gconf->vector_value(name, value) == 0 )
            {
                return 0;
            }
        }

        config->get(name, value);

        return 0;
    }

    /**
     *  Gets a DS configuration attribute
     */
    int get_ds_conf_attribute(const std::string& ds_name,
        const VectorAttribute* &value) const
    {
        return get_conf_attribute("DS_MAD_CONF", ds_name, value);
    };

    /**
     * Gets a VN configuration attribute
     */
    int get_vn_conf_attribute(const std::string& vn_name,
        const VectorAttribute* &value) const
    {
        return get_conf_attribute("VN_MAD_CONF", vn_name, value);
    }

    /**
     *  Gets a TM configuration attribute
     */
    int get_tm_conf_attribute(const std::string& tm_name,
        const VectorAttribute* &value) const
    {
        return get_conf_attribute("TM_MAD_CONF", tm_name, value);
    };

    /**
     *  Gets a Market configuration attribute
     */
    int get_market_conf_attribute( const std::string& mk_name,
        const VectorAttribute* &value) const
    {
        return get_conf_attribute("MARKET_MAD_CONF", mk_name, value);
    };

    /**
     *  Gets an Auth driver configuration attribute
     */
    template<typename T>
    int get_auth_conf_attribute(const std::string& driver,
        const std::string& attribute,
        T& value) const
    {
        return get_conf_attribute("AUTH_MAD_CONF", driver, attribute, value);
    };

    /**
     *  Return the Authorization operation for a VM action
     *
     */
    AuthRequest::Operation get_vm_auth_op(VMActions::Action action) const
    {
        return nebula_configuration->get_vm_auth_op(action);
    }

    /**
     *  Gets the database backend type
     *    @return database backend type
     */
    const std::string& get_db_backend() const
    {
        return db_backend_type;
    }

    // -----------------------------------------------------------------------
    // Default Quotas
    // -----------------------------------------------------------------------

    /**
     *  Get the default quotas for OpenNebula users
     *    @return the default quotas
     */
    const DefaultQuotas& get_default_user_quota() const
    {
        return default_user_quota;
    };

    /**
     *  Set the default quotas for OpenNebula users
     *    @param tmpl template with the default quotas
     *    @param error describes the error if any
     *
     *    @return 0 if success
     */
    int set_default_user_quota(Template *tmpl, std::string& error)
    {
        int rc = default_user_quota.set(tmpl, error);

        if ( rc == 0 )
        {
            rc = default_user_quota.update();
        }

        return rc;
    };

    /**
     *  Get the default quotas for OpenNebula for groups
     *    @return the default quotas
     */
    const DefaultQuotas& get_default_group_quota() const
    {
        return default_group_quota;
    };

    /**
     *  Set the default quotas for OpenNebula groups
     *    @param tmpl template with the default quotas
     *    @param error describes the error if any
     *
     *    @return 0 if success
     */
    int set_default_group_quota(Template *tmpl, std::string& error)
    {
        int rc = default_group_quota.set(tmpl, error);

        if ( rc == 0 )
        {
            rc = default_group_quota.update();
        }

        return rc;
    };

    // -----------------------------------------------------------------------
    // System attributes
    // -----------------------------------------------------------------------
    /**
     *  Reads a System attribute from the DB
     *    @param attr_name name of the attribute
     *    @param cb Callback that will receive the attribute in XML
     *    @return 0 on success
     */
    int select_sys_attribute(const std::string& attr_name, std::string& attr_xml)
    {
        return system_db->select_sys_attribute(attr_name, attr_xml);
    };

    /**
     *  Writes a system attribute in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert_sys_attribute(
        const std::string& attr_name,
        const std::string& xml_attr,
        std::string&       error_str)
    {
        return system_db->insert_sys_attribute(attr_name, xml_attr, error_str);
    };

    /**
     *  Updates the system attribute in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_sys_attribute(
        const std::string& attr_name,
        const std::string& xml_attr,
        std::string&       error_str)
    {
        return system_db->update_sys_attribute(attr_name, xml_attr, error_str);
    };

    // -----------------------------------------------------------------------
    //Constructors and = are private to only access the class through instance
    // -----------------------------------------------------------------------

    Nebula()
        : nebula_configuration(0)
        , federation_enabled(false)
        , federation_master(false)
        , cache(false)
        , zone_id(0)
        , server_id(-1)
        , default_user_quota( "DEFAULT_USER_QUOTAS",
                              "/DEFAULT_USER_QUOTAS/DATASTORE_QUOTA",
                              "/DEFAULT_USER_QUOTAS/NETWORK_QUOTA",
                              "/DEFAULT_USER_QUOTAS/IMAGE_QUOTA",
                              "/DEFAULT_USER_QUOTAS/VM_QUOTA")
        , default_group_quota("DEFAULT_GROUP_QUOTAS",
                             "/DEFAULT_GROUP_QUOTAS/DATASTORE_QUOTA",
                             "/DEFAULT_GROUP_QUOTAS/NETWORK_QUOTA",
                             "/DEFAULT_GROUP_QUOTAS/IMAGE_QUOTA",
                             "/DEFAULT_GROUP_QUOTAS/VM_QUOTA")
        , system_db(0), db_backend_type("sqlite"), logdb(0), fed_logdb(0)
        , vmpool(0), hpool(0), vnpool(0), upool(0), ipool(0), gpool(0), tpool(0)
        , dspool(0), clpool(0), docpool(0), zonepool(0), secgrouppool(0)
        , vdcpool(0), vrouterpool(0), marketpool(0), apppool(0), vmgrouppool(0)
        , vntpool(0), hkpool(0), bjpool(0), sapool(0)
        , lcm(0), vmm(0), im(0), tm(0), dm(0), rm(0), hm(0)
        , hl(0), authm(0), aclm(0), imagem(0), marketm(0), ipamm(0), raftm(0), frm(0)
        , sam(0)
    {
    };

    ~Nebula();

private:
    Nebula& operator=(Nebula const&) = delete;

    // ---------------------------------------------------------------
    // Environment variables
    // ---------------------------------------------------------------

    std::string  hostname;

    // ---------------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------------

    OpenNebulaTemplate * nebula_configuration;

    // ---------------------------------------------------------------
    // Federation - HA
    // ---------------------------------------------------------------

    bool        federation_enabled;
    bool        federation_master;
    bool        cache;
    int         zone_id;
    int         server_id;
    std::string master_oned;
    Zone::ZoneState zone_state = Zone::ENABLED;

    // ---------------------------------------------------------------
    // Default quotas
    // ---------------------------------------------------------------

    DefaultQuotas default_user_quota;
    DefaultQuotas default_group_quota;

    // ---------------------------------------------------------------
    // The system database
    // ---------------------------------------------------------------

    SystemDB *  system_db;
    std::string db_backend_type;

    // ---------------------------------------------------------------
    // Nebula Pools
    // ---------------------------------------------------------------

    LogDB              * logdb;
    FedLogDB           * fed_logdb;
    VirtualMachinePool * vmpool;
    HostPool           * hpool;
    VirtualNetworkPool * vnpool;
    UserPool           * upool;
    ImagePool          * ipool;
    GroupPool          * gpool;
    VMTemplatePool     * tpool;
    DatastorePool      * dspool;
    ClusterPool        * clpool;
    DocumentPool       * docpool;
    ZonePool           * zonepool;
    SecurityGroupPool  * secgrouppool;
    VdcPool            * vdcpool;
    VirtualRouterPool  * vrouterpool;
    MarketPlacePool    * marketpool;
    MarketPlaceAppPool * apppool;
    VMGroupPool        * vmgrouppool;
    VNTemplatePool     * vntpool;
    HookPool           * hkpool;
    BackupJobPool      * bjpool;
    ScheduledActionPool* sapool;

    // ---------------------------------------------------------------
    // Nebula Managers
    // ---------------------------------------------------------------

    LifeCycleManager *      lcm;
    VirtualMachineManager * vmm;
    InformationManager *    im;
    TransferManager *       tm;
    DispatchManager *       dm;
    RequestManager *        rm;
    HookManager *           hm;
    HookLog *               hl;
    AuthManager *           authm;
    AclManager *            aclm;
    ImageManager *          imagem;
    MarketPlaceManager *    marketm;
    IPAMManager *           ipamm;
    RaftManager *           raftm;
    FedReplicaManager *     frm;
    ScheduledActionManager *sam;

    // ---------------------------------------------------------------
    // Implementation functions
    // ---------------------------------------------------------------

    friend void nebula_signal_handler (int sig);

    // ---------------------------------------------------------------
    // Helper functions
    // ---------------------------------------------------------------

    /**
     *  Gets a Generic configuration attribute
     *  @param key String that identifies the configuration parameter group name
     *  @param name Name of the specific configuration parameter
     *  @param value Value of the specific configuration parameter
     *  @return a reference to the generated string
     */
    int get_conf_attribute(
        const std::string& key,
        const std::string& name,
        const VectorAttribute* &value) const;

    /**
     *  Gets a Generic configuration attribute
     *  @param key String that identifies the configuration parameter group name
     *  @param name Name of the specific configuration parameter
     *  @param value Value of the specific configuration parameter
     *  @return a reference to the generated string
     */
    template<typename T>
    int get_conf_attribute(
        const std::string& key,
        const std::string& name,
        const std::string& vname,
        T& value) const
    {
        const VectorAttribute* vattr;

        if ( get_conf_attribute(key, name, vattr) != 0 )
        {
            return -1;
        }

        return vattr->vector_value(vname, value);
    }
};

#endif /*NEBULA_H_*/
