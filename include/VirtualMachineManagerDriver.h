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

#ifndef VIRTUAL_MACHINE_MANAGER_DRIVER_H_
#define VIRTUAL_MACHINE_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "ProtocolMessages.h"
#include "Driver.h"
#include "ActionSet.h"
#include "VMActions.h"
#include "Host.h"
#include "Cluster.h"
#include "VirtualMachine.h"

#include "NebulaLog.h"

/**
 *  VirtualMachineManagerDriver provides a base class to implement VM Manager
 *  Drivers. This class implements the protocol and recover functions
 *  from the Mad interface. Classes derived from the VirtualMachineManagerDriver
 *  must implement the deployment function to generate specific VM
 *  deployment information for the unerlying MAD.
 */
class VirtualMachineManagerDriver : public Driver<vm_msg_t>
{
public:

    VirtualMachineManagerDriver(const std::string& mad_location,
                                const std::map<std::string, std::string>& attrs);

    virtual ~VirtualMachineManagerDriver() = default;

    /**
     *  Generates a driver-specific deployment file:
     *    @param vm pointer to a virtual machine
     *    @param file_name to generate the deployment description
     *    @return 0 on success
     */
    virtual int deployment_description(
            const VirtualMachine *  vm,
            const std::string&      file_name) const = 0;

    /**
     *  Validates the VM raws section
     *    @param raw_section raw section of the VM.
     *    @param error description on error
     *    @return 0 on success
     */
    virtual int validate_raw(const std::string& raw, std::string& error) const
    {
        return 0;
    }

    /**
     *  Validates driver specific attributes in VM Template
     *    @param tmpl Virtual Machine Template
     *    @param error description on error
     *    @return 0 on success
     */
    virtual int validate_template(const VirtualMachine* vm, int hid, int cluster_id,
                                  std::string& error) const
    {
        return 0;
    }

    /**
     *  Check if action is supported for imported VMs
     *    @param action
     *    @return True if it is supported
     */
    bool is_imported_action_supported(VMActions::Action action) const
    {
        return imported_actions.is_set(action);
    }

    /**
     *  @return true if system snapshots are preserved
     */
    bool is_keep_snapshots() const
    {
        return keep_snapshots;
    }

    /**
     *  @return true if datastore live migration
     */
    bool is_ds_live_migration() const
    {
        return ds_live_migration;
    }

    /**
     *  @return true if cold nic attach
     */
    bool is_cold_nic_attach() const
    {
        return cold_nic_attach;
    }

    /**
     *  @return true if hotplug vcpu and memory supported
     */
    bool is_live_resize() const
    {
        return live_resize;
    }

    /**
     *  @return true if shareable disks are supported
     */
    bool support_shareable() const
    {
        return support_shareable_;
    }

protected:
    /**
     *  Gets a configuration attr from driver configuration file (single
     *  version)
     *    @param name of config attribute
     *    @param value of the attribute
     */
    template<typename T>
    void get_default(const std::string& name, T& value) const
    {
        driver_conf.get(name, value);
    }

    /**
     *  Gets a configuration attr from driver configuration file (vector
     *  version)
     *    @param name of config vector attribute for the domain
     *    @param vname of the attribute
     *    @param value of the attribute
     */
    template<typename T>
    int get_default(const char* name, const char* vname, T& value) const
    {
        const VectorAttribute * vattr = driver_conf.get(name);

        if (vattr == 0)
        {
            return -1;
        }

        return vattr->vector_value(vname, value);
    }

    /**
     *  Gets a configuration attribute (single version)
     *  priority VM > host > cluster > config_file
     *    @param vm pointer to Virtual Machine
     *    @param host pointer to Host
     *    @param cluster pointer Cluster
     *    @param name of config attribute
     *    @param value of the attribute
     *    @return true if atribute was found, false otherwise
     */
    template<typename T>
    bool get_attribute(const VirtualMachine * vm,
                       const Host * host,
                       const Cluster * cluster,
                       const std::string& name,
                       T& value) const
    {
        // Get value from VM
        if (vm && vm->get_template_attribute(name, value))
        {
            return true;
        }

        // Get value from host
        if (host && host->get_template_attribute(name, value))
        {
            return true;
        }

        // Get value from cluster
        if (cluster && cluster->get_template_attribute(name, value))
        {
            return true;
        }

        return driver_conf.get(name, value);
    }

    /**
     *  Gets a configuration attribute (vector version)
     *  priority VM > host > cluster > config_file
     *    @param vm pointer to Virtual Machine
     *    @param host pointer to Host
     *    @param cluster pointer Cluster
     *    @param name of config vector attribute for the domain
     *    @param vname of the attribute
     *    @param value of the attribute
     *    @return true if atribute was found, false otherwise
     */
    template<typename T>
    bool get_attribute(const VirtualMachine * vm,
                       const Host * host,
                       const Cluster * cluster,
                       const std::string& name,
                       const std::string& vname,
                       T& value) const
    {
        const VectorAttribute * vattr;

        // Get value from VM
        if (vm)
        {
            vattr = vm->get_template_attribute(name);
            if (vattr && vattr->vector_value(vname, value) == 0)
            {
                return true;
            }
        }

        // Get value from host
        if (host)
        {
            vattr = host->get_template_attribute(name);
            if (vattr && vattr->vector_value(vname, value) == 0)
            {
                return true;
            }
        }

        // Get value from cluster
        if (cluster)
        {
            vattr = cluster->get_template_attribute(name);
            if (vattr && vattr->vector_value(vname, value) == 0)
            {
                return true;
            }
        }

        vattr = driver_conf.get(name);
        if (vattr && vattr->vector_value(vname, value) == 0)
        {
            return true;
        }

        return false;
    }

private:
    friend class VirtualMachineManager;

    static const std::string imported_actions_default;
    static const std::string imported_actions_default_public;

    /**
     *  Configuration file for the driver
     */
    Template    driver_conf;

    /**
     *  List of available actions for imported VMs. Each bit is an action
     *  as defined in History.h, 1=supported and 0=not supported
     */
    ActionSet<VMActions::Action> imported_actions;

    /**
     * Set to true if the hypervisor can keep system snapshots across
     * create/delete cycles and live migrations.
     */
    bool keep_snapshots;

    /**
     * Set to true if live migration between datastores is allowed.
     */
    bool ds_live_migration;

    /**
    * Set to true if cold nic attach/detach calls (pre, post, clean scripts)
    */
    bool cold_nic_attach;

    /**
    * Set to true if hypervisor supports hotplug vcpu and memory
    */
    bool live_resize;

    /**
    * Set to true if hypervisor supports shareable disks
    */
    bool support_shareable_;

    /**
     *  Sends a deploy request to the MAD: "DEPLOY ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void deploy(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::DEPLOY, oid, drv_msg);
    }

    /**
     *  Sends a shutdown request to the MAD: "SHUTDOWN ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void shutdown(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::SHUTDOWN, oid, drv_msg);
    }

    /**
     *  Sends a reset request to the MAD: "RESET ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void reset(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::RESET, oid, drv_msg);
    }

    /**
     *  Sends a reboot request to the MAD: "REBOOT ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void reboot(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::REBOOT, oid, drv_msg);
    }

    /**
     *  Sends a cancel request to the MAD: "CANCEL ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void cancel(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::CANCEL, oid, drv_msg);
    }

    /**
     *  Sends a cleanup request to the MAD: "CLEANUP ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void cleanup(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::CLEANUP, oid, drv_msg);
    }

    /**
     *  Sends a checkpoint request to the MAD: "CHECKPOINT ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void checkpoint(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::CHECKPOINT, oid, drv_msg);
    }

    /**
     *  Sends a save request to the MAD: "SAVE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void save(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::SAVE, oid, drv_msg);
    }

    /**
     *  Sends a save request to the MAD: "SAVE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     */
    void driver_cancel(const int     oid) const
    {
        write_drv(VMManagerMessages::DRIVER_CANCEL, oid, "");
    }

    /**
     *  Sends a save request to the MAD: "RESTORE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void restore(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::RESTORE, oid, drv_msg);
    }


    /**
     *  Sends a migrate request to the MAD: "MIGRATE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void migrate(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::MIGRATE, oid, drv_msg);
    }

    /**
     *  Sends an attach request to the MAD: "ATTACHDISK ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void attach(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::ATTACHDISK, oid, drv_msg);
    }

    /**
     *  Sends a detach request to the MAD: "DETACHDISK ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void detach(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::DETACHDISK, oid, drv_msg);
    }

    /**
     *  Sends an attach NIC request to the MAD: "ATTACHNIC ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void attach_nic(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::ATTACHNIC, oid, drv_msg);
    }

    /**
     *  Sends a detach request to the MAD: "DETACHNIC ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void detach_nic(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::DETACHNIC, oid, drv_msg);
    }

    /**
     *  Sends a snapshot create request to the MAD:
     *  "SNAPSHOTCREATE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void snapshot_create(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::SNAPSHOTCREATE, oid, drv_msg);
    }

    /**
     *  Sends a snapshot revert request to the MAD:
     *  "SNAPSHOTREVERT ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void snapshot_revert(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::SNAPSHOTREVERT, oid, drv_msg);
    }

    /**
     *  Sends a snapshot delete request to the MAD:
     *  "SNAPSHOTDELETE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void snapshot_delete(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::SNAPSHOTDELETE, oid, drv_msg);
    }

    /**
     *  Sends a disk snapshot create request to the MAD:
     *  "DISKSNAPSHOTCREATE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void disk_snapshot_create(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::DISKSNAPSHOTCREATE, oid, drv_msg);
    }

    /**
     *  Sends a disk resize request to the MAD:
     *  "RESIZE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void disk_resize(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::RESIZEDISK, oid, drv_msg);
    }

    /**
     *  Sends an updateconf request to the MAD: "UPDATECONF ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void update_conf(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::UPDATECONF, oid, drv_msg);
    }

    /**
     *  Sends a request to update the VM security groups:
     *  "UPDATESG ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void updatesg(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::UPDATESG, oid, drv_msg);
    }

    /**
     *  Sends a backup create request to the MAD:
     *  "BACKUP ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void backup(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::BACKUP, oid, drv_msg);
    }

    /**
     *  Sends a backup cancel create request to the MAD:
     *  "BACKUPCANCEL ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void backup_cancel(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::BACKUPCANCEL, oid, drv_msg);
    }

    /**
     *  Sends a request to update the VM nic:
     *  "UPDATENIC ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void updatenic(
            const int          oid,
            const std::string& drv_msg) const
    {
        write_drv(VMManagerMessages::UPDATENIC, oid, drv_msg);
    }

    /**
     *
     */
    void write_drv(VMManagerMessages type,
                   const int oid,
                   const std::string& msg) const
    {
        vm_msg_t drv_msg(type, "", oid, msg);
        write(drv_msg);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_MACHINE_MANAGER_DRIVER_H_*/
