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

#include "VirtualMachineTemplate.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::map<std::string, std::set<std::string> > VirtualMachineTemplate::restricted;
std::map<std::string, std::set<std::string> > VirtualMachineTemplate::encrypted;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualMachineTemplate::to_xml_short(string& xml) const
{
    ostringstream oss;
    string labels;
    string msg, schd_msg;

    string schd_rank, schd_ds_rank;
    string schd_req, schd_ds_req;

    string user_prio;

    vector<const VectorAttribute*> attrs;

    if (attributes.empty())
    {
        oss << "<USER_TEMPLATE/>";
    }
    else
    {
        oss << "<USER_TEMPLATE>";

        /* ------------------------------------------------------------------ */
        /* Attributes required by Sunstone                                    */
        /*  - LABELS                                                          */
        /*  - ERROR                                                         */
        /*  - SCHED_MESSAGE                                                   */
        /* ------------------------------------------------------------------ */
        if (get("LABELS", labels) && !labels.empty())
        {
            oss << "<LABELS>" << one_util::escape_xml(labels) << "</LABELS>";
        }

        if (get("ERROR", msg) && !msg.empty())
        {
            oss << "<ERROR>" << one_util::escape_xml(msg) << "</ERROR>";
        }

        if (get("SCHED_MESSAGE", schd_msg) && !schd_msg.empty())
        {
            oss << "<SCHED_MESSAGE>" << one_util::escape_xml(schd_msg) << "</SCHED_MESSAGE>";
        }

        /* ------------------------------------------------------------------ */
        /* Attributes required by Scheduler                                   */
        /*  - SCHED_RANK (RANK - deprecated)                                  */
        /*  - SCHED_DS_RANK                                                   */
        /*  - SCHED_REQUIREMENTS                                              */
        /*  - SCHED_DS_REQUIREMENTS                                           */
        /*                                                                    */
        /*  - SCHED_ACTION                                                    */
        /*  - PUBLIC_CLOUD                                                    */
        /* ------------------------------------------------------------------ */
        if (get("SCHED_RANK", schd_rank))
        {
            oss << "<SCHED_RANK>" << one_util::escape_xml(schd_rank)
                << "</SCHED_RANK>";
        }

        if (get("SCHED_DS_RANK", schd_ds_rank))
        {
            oss << "<SCHED_DS_RANK>" << one_util::escape_xml(schd_ds_rank)
                << "</SCHED_DS_RANK>";
        }

        if (get("SCHED_REQUIREMENTS", schd_req))
        {
            oss << "<SCHED_REQUIREMENTS>" << one_util::escape_xml(schd_req)
                << "</SCHED_REQUIREMENTS>";
        }

        if (get("SCHED_DS_REQUIREMENTS", schd_ds_req))
        {
            oss << "<SCHED_DS_REQUIREMENTS>" << one_util::escape_xml(schd_ds_req)
                << "</SCHED_DS_REQUIREMENTS>";
        }

        if (get("USER_PRIORITY", user_prio))
        {
            oss << "<USER_PRIORITY>" << one_util::escape_xml(user_prio)
                << "</USER_PRIORITY>";
        }

        if ( get("PUBLIC_CLOUD", attrs) > 0 )
        {
            for (auto vattr : attrs)
            {
                vattr->to_xml(oss);
            }
        }

        attrs.clear();

        if ( get("SCHED_ACTION", attrs) > 0 )
        {
            for (auto vattr : attrs)
            {
                vattr->to_xml(oss);
            }
        }

        oss << "</USER_TEMPLATE>";
    }

    xml = oss.str();

    return xml;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

std::map<std::string, std::vector<std::string>> VirtualMachineTemplate::UPDATECONF_ATTRS =
{
    {
        "OS",
        {
            "ARCH",
            "MACHINE",
            "KERNEL",
            "INITRD",
            "BOOTLOADER",
            "BOOT",
            "KERNEL_CMD",
            "ROOT",
            "SD_DISK_BUS",
            "UUID",
            "FIRMWARE"
        }
    },
    {
        "FEATURES",
        {
            "PAE",
            "ACPI",
            "APIC",
            "LOCALTIME",
            "HYPERV",
            "GUEST_AGENT",
            "VIRTIO_SCSI_QUEUES",
            "VIRTIO_BLK_QUEUES",
            "IOTHREADS"
        }
    },
    {
        "INPUT",
        {
            "TYPE",
            "BUS"
        }
    },
    {
        "GRAPHICS",
        {
            "TYPE",
            "LISTEN",
            "PASSWD",
            "KEYMAP",
            "COMMAND"
        }
    },
    {
        "VIDEO",
        {
            "IOMMU",
            "ATS",
            "TYPE",
            "VRAM",
            "RESOLUTION"
        }
    },
    {
        "RAW",
        {
            "TYPE",
            "DATA",
            "VALIDATE",
            "DATA_VMX"
        }
    },
    {
        "CPU_MODEL",
        { "MODEL" }
    },
    {
        "BACKUP_CONFIG",
        {
            "FS_FREEZE",
            "KEEP_LAST",
            "BACKUP_VOLATILE",
            "INCREMENT_MODE",
            "MODE"
        }
    }
};

// -----------------------------------------------------------------------------
/**
 * returns a copy the values of a vector value
 */
static void copy_vector_values(const Template *old_tmpl, Template *new_tmpl,
                               const char * name)
{
    const VectorAttribute * old_attr = old_tmpl->get(name);

    if ( old_attr == 0 )
    {
        return;
    }

    VectorAttribute * new_vattr = new VectorAttribute(name);

    std::vector<std::string> vnames = VirtualMachineTemplate::UPDATECONF_ATTRS[name];

    for (const auto& vname : vnames)
    {
        const string& vval = old_attr->vector_value(vname);

        if (!vval.empty())
        {
            new_vattr->replace(vname, vval);
        }
    }

    if ( new_vattr->empty() )
    {
        delete new_vattr;
    }
    else
    {
        new_tmpl->set(new_vattr);
    }
}

// -----------------------------------------------------------------------------

unique_ptr<VirtualMachineTemplate> VirtualMachineTemplate::get_updateconf_template() const
{
    auto conf_tmpl = make_unique<VirtualMachineTemplate>();

    copy_vector_values(this, conf_tmpl.get(), "OS");

    copy_vector_values(this, conf_tmpl.get(), "FEATURES");

    copy_vector_values(this, conf_tmpl.get(), "INPUT");

    copy_vector_values(this, conf_tmpl.get(), "GRAPHICS");

    copy_vector_values(this, conf_tmpl.get(), "VIDEO");

    copy_vector_values(this, conf_tmpl.get(), "RAW");

    copy_vector_values(this, conf_tmpl.get(), "CPU_MODEL");

    copy_vector_values(this, conf_tmpl.get(), "BACKUP_CONFIG");

    const VectorAttribute * context = get("CONTEXT");

    if ( context != 0 )
    {
        conf_tmpl->set(context->clone());
    }

    return conf_tmpl;
}

