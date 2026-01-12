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

#include "TemplateAPI.h"
#include "RequestLogger.h"
#include "VirtualMachineDisk.h"
#include "VirtualMachinePool.h"
#include "ScheduledActionPool.h"
#include "ImageAPI.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode TemplateAPI::instantiate(int oid,
                                            const string& name,
                                            bool hold,
                                            string str_extra_tmpl,
                                            bool persistent,
                                            int& vid,
                                            RequestAttributes& att)
{
    att.auth_op = AuthRequest::USE;

    bool is_vrouter;
    string original_tmpl_name;

    if ( auto tmpl = tpool->get_ro(oid) )
    {
        is_vrouter = tmpl->is_vrouter();

        original_tmpl_name = tmpl->get_name();
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (is_vrouter)
    {
        att.resp_msg = "Virtual router templates cannot be instantiated";

        return Request::ACTION;
    }

    int instantiate_id = oid;

    if (persistent)
    {
        // Clone private persistent copy of the template
        int new_id;

        string          tmpl_name = name;

        ostringstream   oss;

        if (tmpl_name.empty())
        {
            tmpl_name = original_tmpl_name + "-copy";
        }

        Request::ErrorCode ec = clone(oid, tmpl_name, true, str_extra_tmpl, true, new_id, att);

        if (ec != Request::SUCCESS)
        {
            return ec;
        }

        instantiate_id = new_id;

        oss << "CLONING_TEMPLATE_ID=" << oid << "\n";

        str_extra_tmpl = oss.str();
    }

    return instantiate_helper(instantiate_id, name, hold, str_extra_tmpl, 0, vid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const std::vector<const char*> REMOVE_DISK_ATTRS =
{
    "IMAGE", "IMAGE_UNAME", "IMAGE_UID", "OPENNEBULA_MANAGED"
};

Request::ErrorCode TemplateAPI::clone(int source_id,
                                      const std::string& name,
                                      bool recursive,
                                      const std::string& s_uattr,
                                      bool persistent,
                                      int &new_id,
                                      RequestAttributes& att)
{
    att.auth_op = AuthRequest::USE;

    // -------------------------------------------------------------------------
    // Clone the VMTemplate
    // -------------------------------------------------------------------------
    Request::ErrorCode ec = SharedAPI::clone(source_id, name, false, s_uattr, new_id, att);

    if ( ec != Request::SUCCESS )
    {
        return ec;
    }

    if ( !recursive )
    {
        return Request::SUCCESS;
    }

    // -------------------------------------------------------------------------
    // Clone the template images when recursive flag is set
    // -------------------------------------------------------------------------
    Request r("internal request");
    ImageAPI img_api(r);

    vector<int> new_ids;

    int ndisk = 0;
    vector<VectorAttribute *> vdisks;

    VirtualMachineDisks disks(false);

    RequestAttributes del_att(att);
    RequestAttributes img_att(att);
    img_att.resp_obj    = PoolObjectSQL::IMAGE;

    if ( auto vmtmpl = tpool->get_ro(new_id) )
    {
        vmtmpl->clone_disks(vdisks);
    }
    else
    {
        att.resp_msg = "VM template was removed during clone operation";

        return Request::ACTION;
    }

    disks.init(vdisks, false);

    for ( auto disk : disks )
    {
        int img_id;
        int new_img_id;

        if ( disk->get_image_id(img_id, att.uid) == 0)
        {
            ostringstream oss;

            oss << name << "-disk-" << ndisk;

            ec = img_api.clone(img_id, oss.str(), -1,
                               persistent, new_img_id, img_att);

            if ( ec != Request::SUCCESS)
            {
                NebulaLog::error("ReM", Request::failure_message(ec, img_att, "one.template.clone", PoolObjectSQL::TEMPLATE));

                att.resp_msg = "Failed to clone images: " + img_att.resp_msg;

                goto error_images;
            }

            for (auto attr : REMOVE_DISK_ATTRS)
            {
                disk->remove(attr);
            }

            disk->replace("IMAGE_ID", new_img_id);

            new_ids.push_back(new_img_id);
        }

        ndisk++;
    }

    if ( auto vmtmpl = tpool->get(new_id) )
    {
        vmtmpl->replace_disks(vdisks);

        tpool->update(vmtmpl.get());
    }
    else
    {
        att.resp_msg = "VM template was removed during clone operation.";

        goto error_template;
    }


    return Request::SUCCESS;

error_images:
    if (del(new_id, false, att) != Request::SUCCESS)
    {
        NebulaLog::error("ReM", Request::failure_message(ec, del_att, "one.template.clone", PoolObjectSQL::TEMPLATE));
    }

    goto error_template;

error_template:
    for (auto id : new_ids)
    {
        if (img_api.del_image(id, false, img_att) != Request::SUCCESS)
        {
            NebulaLog::error("ReM", Request::failure_message(ec, img_att, "one.template.clone", PoolObjectSQL::TEMPLATE));
        }
    }

    for (auto disk : vdisks)
    {
        delete disk;
    }

    return Request::ACTION;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode TemplateAPI::chmod(int oid,
                             int owner_u, int owner_m, int owner_a,
                             int group_u, int group_m, int group_a,
                             int other_u, int other_m, int other_a,
                             bool recursive,
                             RequestAttributes& att)
{
    Request::ErrorCode ec = SharedAPI::chmod(oid,
                                             owner_u, owner_m, owner_a,
                                             group_u, group_m, group_a,
                                             other_u, other_m, other_a,
                                             att);

    if ( ec != Request::SUCCESS )
    {
        return ec;
    }

    if (!recursive)
    {
        return Request::SUCCESS;
    }

    vector<VectorAttribute *> vdisks;

    VirtualMachineDisks disks(true);

    set<int> error_ids;
    set<int> img_ids;

    if ( auto tmpl = tpool->get_ro(oid) )
    {
        tmpl->clone_disks(vdisks);
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    disks.init(vdisks, false);

    disks.get_image_ids(img_ids, att.uid);

    Request r("internal request");
    ImageAPI img_api(r);

    for (auto img_id : img_ids)
    {
        ec = img_api.chmod(img_id,
                           owner_u, owner_m, owner_a,
                           group_u, group_m, group_a,
                           other_u, other_m, other_a, att);

        if ( ec != Request::SUCCESS )
        {
            NebulaLog::log("ReM", Log::ERROR, Request::failure_message(ec, att, "one.template.delete", PoolObjectSQL::TEMPLATE));

            error_ids.insert(img_id);
        }
    }

    if ( !error_ids.empty() )
    {
        att.resp_msg = "Cannot chmod " + RequestLogger::object_name(PoolObjectSQL::IMAGE) +
                       ": " + one_util::join(error_ids.begin(), error_ids.end(), ',');

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode TemplateAPI::instantiate_helper(int oid,
                                                   const std::string& name,
                                                   bool on_hold,
                                                   const std::string& str_uattrs,
                                                   Template* extra_tmpl,
                                                   int& vid,
                                                   RequestAttributes& att)
{
    std::string memory, cpu;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualMachinePool* vmpool  = nd.get_vmpool();

    unique_ptr<VirtualMachineTemplate> tmpl;
    VirtualMachineTemplate extended_tmpl;
    VirtualMachineTemplate uattrs;

    string tmpl_name;

    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto rtmpl = tpool->get_ro(oid) )
    {
        tmpl_name = rtmpl->get_name();
        tmpl      = rtmpl->clone_template();

        rtmpl->get_permissions(perms);
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    Request::ErrorCode ec = merge(tmpl.get(), str_uattrs, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    if ( extra_tmpl )
    {
        tmpl->merge(extra_tmpl);
    }

    ec = as_uid_gid(tmpl.get(), att);

    if ( ec != Request::SUCCESS )
    {
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Store the template attributes in the VM                                */
    /* ---------------------------------------------------------------------- */
    tmpl->erase("NAME");
    tmpl->erase("TEMPLATE_NAME");
    tmpl->erase("TEMPLATE_ID");

    tmpl->set(new SingleAttribute("TEMPLATE_NAME", tmpl_name));
    tmpl->set(new SingleAttribute("TEMPLATE_ID", to_string(oid)));

    if (!name.empty())
    {
        tmpl->set(new SingleAttribute("NAME", name));
    }

    if (VirtualMachine::parse_topology(tmpl.get(), att.resp_msg) != 0)
    {
        return Request::ALLOCATE;
    }

    //--------------------------------------------------------------------------

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::USE, perms); //USE TEMPLATE

    if (!str_uattrs.empty())
    {
        string tmpl_str;

        tmpl->to_xml(tmpl_str);

        // CREATE TEMPLATE
        ar.add_create_auth(att.uid, att.gid, PoolObjectSQL::TEMPLATE,
                           tmpl_str);
    }

    extended_tmpl = *tmpl;

    VirtualMachineDisks::extended_info(att.uid, &extended_tmpl);

    VirtualMachine::set_auth_request(att.uid, ar, &extended_tmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    extended_tmpl.get("MEMORY", memory);
    extended_tmpl.get("CPU", cpu);

    extended_tmpl.add("RUNNING_MEMORY", memory);
    extended_tmpl.add("RUNNING_CPU", cpu);
    extended_tmpl.add("RUNNING_VMS", 1);
    extended_tmpl.add("VMS", 1);

    QuotaVirtualMachine::add_running_quota_generic(extended_tmpl);

    if (!quota_authorization(&extended_tmpl, Quotas::VIRTUALMACHINE, att, att.resp_msg))
    {
        return Request::AUTHORIZATION;
    }

    bool ds_quota_auth = true;

    vector<unique_ptr<Template>> ds_quotas;
    vector<unique_ptr<Template>> applied;

    VirtualMachineDisks::image_ds_quotas(&extended_tmpl, ds_quotas);

    for ( auto& ds : ds_quotas )
    {
        if ( !quota_authorization(ds.get(), Quotas::DATASTORE, att, att.resp_msg) )
        {
            ds_quota_auth = false;
            break;
        }
        else
        {
            applied.push_back(move(ds));
        }
    }

    if ( ds_quota_auth == false )
    {
        quota_rollback(&extended_tmpl, Quotas::VIRTUALMACHINE, att);

        for ( auto& ds : applied )
        {
            quota_rollback(ds.get(), Quotas::DATASTORE, att);
        }

        return Request::AUTHORIZATION;
    }

    /* ---------------------------------------------------------------------- */
    /* Save SCHED_ACTION attributes for allocation                            */
    /* ---------------------------------------------------------------------- */
    std::vector<unique_ptr<VectorAttribute>> sas;

    tmpl->remove("SCHED_ACTION", sas);

    int rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              move(tmpl), &vid, att.resp_msg, on_hold);

    if ( rc < 0 )
    {
        quota_rollback(&extended_tmpl, Quotas::VIRTUALMACHINE, att);

        for ( auto& ds : applied )
        {
            quota_rollback(ds.get(), Quotas::DATASTORE, att);
        }

        return Request::ALLOCATE;
    }

    /* ---------------------------------------------------------------------- */
    /* Create ScheduleAction and associate to the VM                          */
    /* ---------------------------------------------------------------------- */
    auto sapool = Nebula::instance().get_sapool();

    time_t stime  = time(0);
    bool sa_error = false;

    std::vector<int> sa_ids;

    for (const auto& sa : sas)
    {
        int sa_id = sapool->allocate(PoolObjectSQL::VM, vid, stime, sa.get(), att.resp_msg);

        if (sa_id < 0)
        {
            sa_error = true;
            break;
        }

        sa_ids.push_back(sa_id);
    }

    /* ---------------------------------------------------------------------- */
    /* Error creating a SCHED_ACTION rollback created objects                 */
    /* ---------------------------------------------------------------------- */
    if (sa_error)
    {
        // Consistency check, the VM template should not have parsing errors
        // of Scheduled Actions at this point.
        sapool->drop_sched_actions(sa_ids);

        // Test the rollback quota, not sure if it's correct
        quota_rollback(&extended_tmpl, Quotas::VIRTUALMACHINE, att);

        for ( auto& ds : applied )
        {
            quota_rollback(ds.get(), Quotas::DATASTORE, att);
        }

        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /* Associate SCHED_ACTIONS to the VM                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto vm = vmpool->get(vid) )
    {
        for (const auto sa_id: sa_ids)
        {
            vm->sched_actions().add(sa_id);
        }

        vmpool->update(vm.get());
    }
    else
    {
        att.resp_msg = "VM deleted while setting up SCHED_ACTION";

        sapool->drop_sched_actions(sa_ids);

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode TemplateAPI::merge(Template * tmpl,
                                      const std::string &str_uattrs,
                                      RequestAttributes& att)
{
    VirtualMachineTemplate  uattrs;

    int rc = uattrs.parse_str_or_xml(str_uattrs, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }
    else if (uattrs.empty())
    {
        return Request::SUCCESS;
    }

    if (!att.is_admin())
    {
        string aname;

        if (uattrs.check_restricted(aname, tmpl, true))
        {
            att.resp_msg ="User Template includes a restricted attribute " + aname;

            return Request::AUTHORIZATION;
        }
    }

    tmpl->merge(&uattrs);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TemplateAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                    bool recursive,
                    RequestAttributes& att)
{
    vector<VectorAttribute *> vdisks;

    VirtualMachineDisks disks(true);

    int tid = object->get_oid();

    if (recursive)
    {
        static_cast<VMTemplate *>(object.get())->clone_disks(vdisks);

        disks.init(vdisks, false);
    }

    int rc = SharedAPI::drop(std::move(object), false, att);

    if ( rc != 0 )
    {
        return rc;
    }

    if ( !recursive )
    {
        return 0;
    }

    set<int> error_ids;
    set<int> img_ids;

    Request r("internal request");
    ImageAPI img_api(r);

    disks.get_image_ids(img_ids, att.uid);

    for (auto iid : img_ids)
    {
        if ( img_api.del_image(iid, false, att) != Request::SUCCESS )
        {
            NebulaLog::warn("ReM", att.resp_msg);

            error_ids.insert(iid);
        }
    }

    if ( !error_ids.empty() )
    {
        att.resp_msg = "Template " + to_string(tid) +
                       " deleted, unable to recursively delete " +
                       RequestLogger::object_name(PoolObjectSQL::IMAGE) +
                       ": " + one_util::join(error_ids.begin(), error_ids.end(), ',');

        NebulaLog::warn("ReM", att.resp_msg);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode TemplateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                              int& id,
                                              RequestAttributes& att)
{
    unique_ptr<VirtualMachineTemplate> ttmpl(
            static_cast<VirtualMachineTemplate *>(tmpl.release()));

    int rc = tpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                             std::move(ttmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode TemplateAllocateAPI::allocate_authorization(Template *obj_template,
                                                               RequestAttributes&  att,
                                                               PoolObjectAuth *cluster_perms)
{
    if ( auto ec = SharedAPI::allocate_authorization(obj_template, att, cluster_perms);
         ec != Request::SUCCESS )
    {
        return ec;
    }

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(obj_template);

    // ------------ Check template for restricted attributes -------------------
    if (!att.is_admin())
    {
        string      aname;

        if (ttmpl->check_restricted(aname))
        {
            att.resp_msg = "VM Template includes a restricted attribute "+aname;

            return Request::AUTHORIZATION;
        }
    }

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode TemplateInfoAPI::info(int oid,
                                         bool extended,
                                         bool decrypt,
                                         string& xml,
                                         RequestAttributes& att)
{
    unique_ptr<VirtualMachineTemplate> extended_tmpl;

    PoolObjectAuth perms;

    auto vm_tmpl = tpool->get_ro(oid);

    if ( !vm_tmpl )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (extended)
    {
        extended_tmpl = vm_tmpl->clone_template();
    }

    vm_tmpl->get_permissions(perms);

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms); //USE TEMPLATE

    if (extended)
    {
        VirtualMachine::set_auth_request(att.uid, ar, extended_tmpl.get(), false);

        VirtualMachineDisks::extended_info(att.uid, extended_tmpl.get());
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // Check optional parameter - decrypt
    if (att.is_admin() && decrypt)
    {
        vm_tmpl->decrypt();
    }

    if (extended)
    {
        vm_tmpl->to_xml(xml, extended_tmpl.get());
    }
    else
    {
        vm_tmpl->to_xml(xml);
    }

    return Request::SUCCESS;
}