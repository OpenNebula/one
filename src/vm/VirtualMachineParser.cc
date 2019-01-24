/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
#include <limits.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <regex.h>
#include <unistd.h>

#include <iostream>
#include <sstream>
#include <queue>

#include "VirtualMachine.h"
#include "VirtualNetworkPool.h"
#include "ImagePool.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Snapshots.h"

#include "Nebula.h"

#include "vm_file_var_syntax.h"
#include "vm_var_syntax.h"
#include "vm_var_parser.h"

/* -------------------------------------------------------------------------- */
/* Parser constanta                                                           */
/* -------------------------------------------------------------------------- */

const char * VirtualMachine::NO_NIC_DEFAULTS[] = {"NETWORK_ID", "NETWORK",
    "NETWORK_UID", "NETWORK_UNAME"};

const int VirtualMachine::NUM_NO_NIC_DEFAULTS = 4;

const char*  VirtualMachine::VROUTER_ATTRIBUTES[] = {
        "VROUTER_ID",
        "VROUTER_KEEPALIVED_ID",
        "VROUTER_KEEPALIVED_PASSWORD"};
const int VirtualMachine::NUM_VROUTER_ATTRIBUTES = 3;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/**
 *  Generates image attributes (DS_ID, TM_MAD, SOURCE...) for KERNEL and
 *  INITRD files.
 *    @param os attribute of the VM template
 *    @param base_name of the attribute "KERNEL", or "INITRD"
 *    @param base_type of the image attribute KERNEL, RAMDISK
 *    @param error_str Returns the error reason, if any
 *    @return 0 on succes
 */
int VirtualMachine::set_os_file(VectorAttribute* os, const string& base_name,
        Image::ImageType base_type, string& error_str)
{
    vector<int>  img_ids;
    Nebula& nd = Nebula::instance();

    ImagePool * ipool = nd.get_ipool();
    Image *     img   = 0;

    int img_id;

    Image::ImageType  type;
    Image::ImageState state;

    DatastorePool * ds_pool = nd.get_dspool();
    Datastore *     ds;
    int             ds_id;

    string attr;
    string base_name_ds     = base_name + "_DS";
    string base_name_id     = base_name + "_DS_ID";
    string base_name_source = base_name + "_DS_SOURCE";
    string base_name_ds_id  = base_name + "_DS_DSID";
    string base_name_tm     = base_name + "_DS_TM";
    string base_name_cluster= base_name + "_DS_CLUSTER_ID";

    string type_str;

    attr = os->vector_value(base_name_ds.c_str());

    if ( attr.empty() )
    {
        return 0;
    }

    if ( parse_file_attribute(attr, img_ids, error_str) != 0 )
    {
        return -1;
    }

    if ( img_ids.size() != 1 )
    {
        error_str = "Only one FILE variable can be used in: " + attr;
        return -1;
    }

    img_id = img_ids.back();

    img = ipool->get_ro(img_id);

    if ( img == 0 )
    {
        error_str = "Image no longer exists in attribute: " + attr;
        return -1;
    }

    state = img->get_state();

    ds_id = img->get_ds_id();
    type  = img->get_type();

    os->remove(base_name);

    os->replace(base_name_id,     img->get_oid());
    os->replace(base_name_source, img->get_source());
    os->replace(base_name_ds_id,  img->get_ds_id());

    img->unlock();

    type_str = Image::type_to_str(type);

    if ( type != base_type )
    {
        ostringstream oss;

        oss << base_name << " needs an image of type "
            << Image::type_to_str(base_type) << " and not "
            << type_str;

        error_str = oss.str();
        return -1;
    }

    if ( state != Image::READY )
    {
        ostringstream oss;

        oss << type_str << " Image '" << img_id << " 'not in READY state.";

        error_str = oss.str();
        return -1;
    }

    ds = ds_pool->get_ro(ds_id);

    if ( ds == 0 )
    {
        error_str = "Associated datastore for image does not exist";
        return -1;
    }

    os->replace(base_name_tm, ds->get_tm_mad());

    set<int> cluster_ids = ds->get_cluster_ids();

    if (!cluster_ids.empty())
    {
        os->replace(base_name_cluster, one_util::join(cluster_ids, ','));
    }

    ds->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_os(string& error_str)
{
    int num;
    int rc;

    vector<Attribute *> os_attr;
    VectorAttribute *   os;

    vector<Attribute *>::iterator it;

    num = user_obj_template->remove("OS", os_attr);

    for (it=os_attr.begin(); it != os_attr.end(); it++)
    {
        obj_template->set(*it);
    }

    if ( num == 0 )
    {
        return 0;
    }
    else if ( num > 1 )
    {
        error_str = "Only one OS attribute can be defined.";
        return -1;
    }

    os = dynamic_cast<VectorAttribute *>(os_attr[0]);

    if ( os == 0 )
    {
        error_str = "Internal error parsing OS attribute.";
        return -1;
    }

    rc = set_os_file(os, "KERNEL", Image::KERNEL, error_str);

    if ( rc != 0 )
    {
        return -1;
    }

    rc = set_os_file(os, "INITRD", Image::RAMDISK, error_str);

    if ( rc != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_defaults(string& error_str, Template * tmpl)
{
    int num;

    vector<Attribute *> attr;
    VectorAttribute*    vatt = 0;

    num = tmpl->remove("NIC_DEFAULT", attr);

    if ( num == 0 )
    {
        return 0;
    }

    if ( num > 1 )
    {
        error_str = "Only one NIC_DEFAULT attribute can be defined.";
        goto error_cleanup;
    }

    vatt = dynamic_cast<VectorAttribute *>(attr[0]);

    if ( vatt == 0 )
    {
        error_str = "Wrong format for NIC_DEFAULT attribute.";
        goto error_cleanup;
    }

    for (int i=0; i < NUM_NO_NIC_DEFAULTS; i++)
    {
        if(vatt->vector_value(NO_NIC_DEFAULTS[i]) != "")
        {
            ostringstream oss;
            oss << "Attribute " << NO_NIC_DEFAULTS[i]
                << " is not allowed inside NIC_DEFAULT.";

            error_str = oss.str();

            return -1;
        }
    }

    obj_template->set(vatt);

    return 0;

error_cleanup:

    for (int i = 0; i < num ; i++)
    {
        delete attr[i];
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_vrouter(string& error_str, Template * tmpl)
{
    string st;

    for (int i = 0; i < NUM_VROUTER_ATTRIBUTES; i++)
    {
        tmpl->get(VROUTER_ATTRIBUTES[i], st);

        if (!st.empty())
        {
            obj_template->replace(VROUTER_ATTRIBUTES[i], st);
        }

        tmpl->erase(VROUTER_ATTRIBUTES[i]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int check_pci_attributes(VectorAttribute * pci, const string& default_bus,
		string& error_str)
{
    static string attrs[] = {"VENDOR", "DEVICE", "CLASS"};
    static int num_attrs  = 3;

	string bus;
    bool   found = false;

    for (int i = 0; i < num_attrs; i++)
    {
        unsigned int val;
        int rc = HostSharePCI::get_pci_value(attrs[i].c_str(), pci, val);

        if (rc == -1)
        {
            error_str = "Wrong Hex value for PCI attribute " + attrs[i];
            return -1;
        }
        else if ( rc != 0 )
        {
            found = true;
        }
    }

    if (!found)
    {
        error_str = "DEVICE, VENDOR or CLASS must be defined for PCI.";
        return -1;
    }

	if ( HostSharePCI::set_pci_address(pci, default_bus) != 0 )
	{
		error_str = "Wrong BUS in PCI attribute";
		return -1;
	}

    return 0;
}

int VirtualMachine::parse_pci(string& error_str, Template * tmpl)
{
    vector<VectorAttribute *> array_pci;
    vector<VectorAttribute *>::iterator it;

    int pci_id = 0;

    tmpl->remove("PCI", array_pci);

    for (it = array_pci.begin(); it !=array_pci.end(); ++it, ++pci_id)
    {
        (*it)->replace("PCI_ID", pci_id);

        obj_template->set(*it);
    }

	Nebula& nd = Nebula::instance();
	string  default_bus;

	nd.get_configuration_attribute("PCI_PASSTHROUGH_BUS", default_bus);

    for (it = array_pci.begin(); it !=array_pci.end(); ++it)
    {
        if ( check_pci_attributes(*it, default_bus, error_str) != 0 )
        {
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_graphics(string& error_str, Template * tmpl)
{
    VectorAttribute * user_graphics = tmpl->get("GRAPHICS");

    if ( user_graphics == 0 )
    {
        return 0;
    }

    VectorAttribute * graphics = new VectorAttribute(user_graphics);

    tmpl->erase("GRAPHICS");

    obj_template->erase("GRAPHICS");
    obj_template->set(graphics);

    if ( !graphics->vector_value("PORT").empty() )
    {
        unsigned int port;

        int rc = graphics->vector_value("PORT", port);

        if (rc == -1 || port > 65535 )
        {
            error_str = "Wrong PORT number in GRAPHICS attribute";
            return -1;
        }
    }

    string random_passwd = graphics->vector_value("RANDOM_PASSWD");

    if ( !random_passwd.empty() )
    {
        graphics->replace("PASSWD", one_util::random_password());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_requirements(string& error_str)
{
    int rc, num;

    vector<Attribute *> array_reqs;
    SingleAttribute *   reqs;

    string              parsed;

    num = user_obj_template->remove("SCHED_REQUIREMENTS", array_reqs);

    if ( num == 0 ) // Compatibility with old REQUIREMENTS attribute
    {
        num = user_obj_template->remove("REQUIREMENTS", array_reqs);
    }
    else
    {
        user_obj_template->erase("REQUIREMENTS");
    }

    if ( num == 0 )
    {
        return 0;
    }
    else if ( num > 1 )
    {
        error_str = "Only one SCHED_REQUIREMENTS attribute can be defined.";
        goto error_cleanup;
    }

    reqs = dynamic_cast<SingleAttribute *>(array_reqs[0]);

    if ( reqs == 0 )
    {
        error_str = "Wrong format for SCHED_REQUIREMENTS attribute.";
        goto error_cleanup;
    }

    rc = parse_template_attribute(reqs->value(), parsed, error_str);

    if ( rc == 0 )
    {
        SingleAttribute * reqs_parsed;

        reqs_parsed = new SingleAttribute("SCHED_REQUIREMENTS",parsed);
        user_obj_template->set(reqs_parsed);
    }

    /* --- Delete old requirements attribute --- */

    delete array_reqs[0];

    return rc;

error_cleanup:
    for (int i = 0; i < num ; i++)
    {
        delete array_reqs[i];
    }

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void VirtualMachine::parse_well_known_attributes()
{
    /*
     * List of meaningful attributes, used in other places and expected in
     * obj_template:
     *
     * DISK
     * NIC
     * VCPU
     * MEMORY
     * CPU
     * CONTEXT
     * OS
     * GRAPHICS
     *
     * INPUT
     * FEATURES
     * RAW
     * CLONING_TEMPLATE_ID
     */

    vector<Attribute *>             v_attr;
    vector<Attribute *>::iterator   it;

    string names[] = {"INPUT", "FEATURES", "RAW", "CLONING_TEMPLATE_ID"};

    for (int i=0; i<4; i++)
    {
        v_attr.clear();

        user_obj_template->remove(names[i], v_attr);

        for (it=v_attr.begin(); it != v_attr.end(); it++)
        {
            obj_template->set(*it);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VirtualMachine Lex & YACC parser functions                                 */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_template_attribute(const string& attribute,
                                             string&       parsed,
                                             string&       error_str)
{
    const char *  str;
    int           rc;
    ostringstream oss_parsed;
    char *        error_msg = 0;

    YY_BUFFER_STATE str_buffer = 0;
    yyscan_t        scanner = 0;

    vm_var_lex_init(&scanner);

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str, scanner);

    if (str_buffer == 0)
    {
        log("VM",Log::ERROR,"Error setting scan buffer");
        return -1;
    }

    rc = vm_var_parse(this, &oss_parsed, &error_msg, scanner);

    vm_var__delete_buffer(str_buffer, scanner);

    vm_var_lex_destroy(scanner);

    if ( rc != 0 && error_msg != 0 )
    {
        ostringstream oss;

        oss << "Error parsing: " << attribute << ". " << error_msg;
        log("VM", Log::ERROR, oss);

        error_str = oss.str();

        free(error_msg);
    }

    parsed = oss_parsed.str();

    return rc;
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_file_attribute(string       attribute,
                                         vector<int>& img_ids,
                                         string&      error)
{
    const char *  str;
    int           rc;
    ostringstream oss_parsed;
    char *        error_msg = 0;

    size_t non_blank_pos;

    YY_BUFFER_STATE str_buffer = 0;
    yyscan_t        scanner = 0;

    //Removes leading blanks from attribute, these are not managed
    //by the parser as it is common to the other VM varibales
    non_blank_pos = attribute.find_first_not_of(" \t\n\v\f\r");

    if ( non_blank_pos != string::npos )
    {
        attribute.erase(0, non_blank_pos);
    }

    vm_var_lex_init(&scanner);

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str, scanner);

    if (str_buffer == 0)
    {
        log("VM",Log::ERROR,"Error setting scan buffer");
        return -1;
    }

    rc = vm_file_var_parse(this, &img_ids, &error_msg, scanner);

    vm_var__delete_buffer(str_buffer, scanner);

    vm_var_lex_destroy(scanner);

    if ( rc != 0  )
    {
        ostringstream oss;

        if ( error_msg != 0 )
        {
            oss << "Error parsing: " << attribute << ". " << error_msg;
            free(error_msg);
        }
        else
        {
            oss << "Unknown error parsing: " << attribute << ".";
        }

        error = oss.str();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_public_clouds(const char * pname, string& error)
{
    vector<VectorAttribute *>           attrs;
    vector<VectorAttribute *>::iterator it;

    string * str;
    string p_vatt;

    int rc  = 0;
    int num = user_obj_template->remove(pname, attrs);

    for (it = attrs.begin(); it != attrs.end(); it++)
    {
        str = (*it)->marshall();

        if ( str == 0 )
        {
            ostringstream oss;
            oss << "Internal error processing " << pname;
            error = oss.str();
            rc    = -1;
            break;
        }

        rc = parse_template_attribute(*str, p_vatt, error);

        delete str;

        if ( rc != 0 )
        {
            rc = -1;
            break;
        }

        VectorAttribute * nvatt = new VectorAttribute(pname);

        nvatt->unmarshall(p_vatt);

        user_obj_template->set(nvatt);
    }

    for (int i = 0; i < num ; i++)
    {
        delete attrs[i];
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_cpu_model(Template * tmpl)
{
    vector<VectorAttribute *> cm_attr;
    vector<VectorAttribute *>::iterator it;

    int num = tmpl->remove("CPU_MODEL", cm_attr);

    if ( num == 0 )
    {
        return 0;
    }

    it = cm_attr.begin();

    obj_template->set(*it);

    for ( ++it; it != cm_attr.end(); ++it)
    {
        delete *it;
    }

    return 0;
}

