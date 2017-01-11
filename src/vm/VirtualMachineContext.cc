/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

/* -------------------------------------------------------------------------- */
/* Context constants                                                          */
/* -------------------------------------------------------------------------- */
const char * VirtualMachine::NETWORK_CONTEXT[][2] = {
        {"IP", "IP"},
        {"MAC", "MAC"},
        {"MASK", "NETWORK_MASK"},
        {"NETWORK", "NETWORK_ADDRESS"},
        {"GATEWAY", "GATEWAY"},
        {"DNS", "DNS"},
        {"SEARCH_DOMAIN", "SEARCH_DOMAIN"},
        {"MTU", "GUEST_MTU"},
        {"VLAN_ID", "VLAN_ID"},
        {"VROUTER_IP", "VROUTER_IP"},
        {"VROUTER_MANAGEMENT", "VROUTER_MANAGEMENT"}};
const int VirtualMachine::NUM_NETWORK_CONTEXT = 11;

const char*  VirtualMachine::NETWORK6_CONTEXT[][2] = {
        {"IP6", "IP6_GLOBAL"},
        {"IP6_ULA", "IP6_ULA"},
        {"GATEWAY6", "GATEWAY6"},
        {"CONTEXT_FORCE_IPV4", "CONTEXT_FORCE_IPV4"},
        {"VROUTER_IP6", "VROUTER_IP6_GLOBAL"}};

const int VirtualMachine::NUM_NETWORK6_CONTEXT = 5;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*   CONTEXT - Public Interface                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::generate_context(string &files, int &disk_id,
        const string& token_password)
{
    ofstream file;
    string   files_ds, error_str;

    vector<const VectorAttribute*> attrs;

    map<string, string>::const_iterator it;

    files = "";
    bool token;

    if ( history == 0 )
    {
        return -1;
    }

    VectorAttribute * context = obj_template->get("CONTEXT");

    if ( context == 0 )
    {
        log("VM", Log::INFO, "Virtual Machine has no context");
        return 0;
    }

    //Generate dynamic context attributes
    if ( generate_network_context(context, error_str) != 0 )
    {
        ostringstream oss;

        oss << "Cannot parse network context:: " << error_str;
        log("VM", Log::ERROR, oss);
        return -1;
    }

    file.open(history->context_file.c_str(),ios::out);

    if (file.fail() == true)
    {
        ostringstream oss;

        oss << "Could not open context file: " << history->context_file;
        log("VM", Log::ERROR, oss);
        return -1;
    }

    files    = context->vector_value("FILES");
    files_ds = context->vector_value("FILES_DS");

    if (!files_ds.empty())
    {
        files += " ";
        files += files_ds;
    }

    for (size_t i=0;i<files.length();i++)
    {
        if (files[i] == '\n')
        {
            files[i] = ' ';
        }
    }

    context->vector_value("TOKEN", token);

    if (token)
    {
        ofstream      token_file;
        ostringstream oss;

        string* encrypted;
        string  tk_error;

        if (token_password.empty())
        {
            tk_error = "Cannot generate OneGate token: TOKEN_PASSWORD not set in"
                       " the user template.";
            file.close();

            log("VM", Log::ERROR, tk_error.c_str());
            set_template_error_message(tk_error);

            return -1;
        }

        token_file.open(history->token_file.c_str(), ios::out);

        if (token_file.fail())
        {
            tk_error = "Cannot create token file";

            file.close();

            log("VM", Log::ERROR, tk_error.c_str());
            set_template_error_message(tk_error);

            return -1;
        }

        oss << oid << ':' << stime;

        encrypted = one_util::aes256cbc_encrypt(oss.str(), token_password);

        token_file << *encrypted << endl;

        token_file.close();

        delete encrypted;

        files += (" " + history->token_file);
    }

    const map<string, string> values = context->value();

    file << "# Context variables generated by OpenNebula\n";

    for (it=values.begin(); it != values.end(); it++ )
    {
        //Replace every ' in value by '\''
        string escape_str(it->second);
        size_t pos = 0;

        while ((pos = escape_str.find('\'', pos)) != string::npos)
        {
            escape_str.replace(pos,1,"'\\''");
            pos = pos + 4;
        }

        file << it->first <<"='" << escape_str << "'" << endl;
    }

    file.close();

    context->vector_value("DISK_ID", disk_id);

    return 1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_created_by_uid() const
{
    int created_by_uid;

    if (obj_template->get("CREATED_BY", created_by_uid))
    {
        return created_by_uid;
    }

    return get_uid();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*   CONTEXT - Private Interface                                              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void parse_context_network(const char* vars[][2], int num_vars,
        VectorAttribute * context, VectorAttribute * nic)
{
    string nic_id = nic->vector_value("NIC_ID");

    for (int i=0; i < num_vars; i++)
    {
        ostringstream cvar;
        string cval;

        cvar << "ETH" << nic_id << "_" << vars[i][0];

        cval = nic->vector_value(vars[i][1]); //Check the NIC

        if (cval.empty()) //Will check the AR and VNET
        {
            ostringstream cval_ss;

            cval_ss << "$NETWORK["<< vars[i][1] <<", NIC_ID=\""<< nic_id <<"\"]";
            cval = cval_ss.str();
        }

        context->replace(cvar.str(), cval);
    }
}


int VirtualMachine::generate_network_context(VectorAttribute* context,
        string& error_str)
{
    bool net_context;

    context->vector_value("NETWORK", net_context);

    if (!net_context)
    {
        return 0;
    }

    vector<VectorAttribute *> vatts;
    int rc;

    string  parsed;
    string* str;

    VectorAttribute tmp_context("TMP_CONTEXT");

    int num_vatts = obj_template->get("NIC", vatts);

    if ( num_vatts == 0 )
    {
         return 0;
    }

    for(int i=0; i<num_vatts; i++)
    {
        parse_context_network(NETWORK_CONTEXT, NUM_NETWORK_CONTEXT,
                &tmp_context, vatts[i]);
        parse_context_network(NETWORK6_CONTEXT, NUM_NETWORK6_CONTEXT,
                &tmp_context, vatts[i]);
    }

    str = tmp_context.marshall();

    if (str == 0)
    {
        error_str = "Internal error generating network context";
        return -1;
    }

    rc = parse_template_attribute(*str, parsed, error_str);

    delete str;

    if (rc != 0)
    {
        return -1;
    }

    tmp_context.clear();

    tmp_context.unmarshall(parsed);

    context->merge(&tmp_context, true);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void parse_pci_context_network(const char* vars[][2], int num_vars,
        VectorAttribute * context, VectorAttribute * nic)
{
    string pci_id = nic->vector_value("PCI_ID");

    for (int i=0; i < num_vars; i++)
    {
		ostringstream cvar;

        cvar << "PCI" << pci_id << "_" << vars[i][0];

        string  cval = nic->vector_value(vars[i][1]);

        if (!cval.empty())
        {
			context->replace(cvar.str(), cval);
        }
    }

}

/**
 *  Generate the PCI related CONTEXT setions, i.e. PCI_*. This function
 *  is also adds basic network attributes for pass-through NICs
 *    @param context attribute of the VM
 *    @return true if the net context was generated.
 */
bool VirtualMachine::generate_pci_context(VectorAttribute * context)
{
    bool net_context;
    vector<VectorAttribute *> vatts;

    context->vector_value("NETWORK", net_context);

    int num_vatts = obj_template->get("PCI", vatts);

    for(int i=0; i<num_vatts; i++)
    {
		if ( net_context && vatts[i]->vector_value("TYPE") == "NIC" )
		{
			parse_pci_context_network(NETWORK_CONTEXT, NUM_NETWORK_CONTEXT,
					context, vatts[i]);
			parse_pci_context_network(NETWORK6_CONTEXT, NUM_NETWORK6_CONTEXT,
					context, vatts[i]);
		}

		ostringstream cvar;

		cvar << "PCI" << vatts[i]->vector_value("PCI_ID") << "_ADDRESS";

		string cval = vatts[i]->vector_value("VM_ADDRESS");

		if (!cval.empty())
		{
			context->replace(cvar.str(), cval);
		}
    }

    return net_context;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::generate_token_context(VectorAttribute * context, string& e)
{
    bool   token;
    string ep;

    context->vector_value("TOKEN", token);

    if ( token == false )
    {
        return 0;
    }

    Nebula::instance().get_configuration_attribute("ONEGATE_ENDPOINT", ep);

    if ( ep.empty() )
    {
        e = "TOKEN set, but onegate endpoint was not defined in oned.conf.";
        return -1;
    }

    context->replace("ONEGATE_ENDPOINT", ep);
    context->replace("VMID", oid);

    // Store the original owner to compute token_password in case of a chown
    replace_template_attribute("CREATED_BY", uid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_context(string& error_str)
{
    VectorAttribute * context = obj_template->get("CONTEXT");

    if ( context == 0 )
    {
        return 0;
    }

    string files_ds = context->vector_value("FILES_DS");

    context->remove("FILES_DS");

    // -------------------------------------------------------------------------
    // Add network context and parse variables
    // -------------------------------------------------------------------------
    if (parse_context_variables(&context, error_str) == -1 ||
            generate_network_context(context, error_str) == -1 )
    {
        return -1;
    }

	generate_pci_context(context);

    // -------------------------------------------------------------------------
    // Parse FILE_DS variables
    // -------------------------------------------------------------------------
    if (!files_ds.empty())
    {
        string files_ds_parsed;
        string st;

        ostringstream oss_parsed;

        vector<int> img_ids;

        if ( parse_file_attribute(files_ds, img_ids, error_str) != 0 )
        {
            return -1;
        }

        if ( img_ids.size() > 0 )
        {
            vector<int>::iterator it;

            Nebula& nd = Nebula::instance();

            ImagePool * ipool = nd.get_ipool();
            Image  *    img   = 0;

            Image::ImageType type;
            Image::ImageState state;

            for ( it=img_ids.begin() ; it < img_ids.end(); it++ )
            {
                img = ipool->get(*it, true);

                if ( img != 0 )
                {
                    oss_parsed << img->get_source() << ":'"
                               << img->get_name() << "' ";

                    type  = img->get_type();
                    state = img->get_state();

                    img->unlock();

                    if (type != Image::CONTEXT)
                    {
                        error_str = "Only images of type CONTEXT can be used in"
                                    " FILE_DS attribute.";
                        return -1;
                    }

                    if ( state != Image::READY )
                    {
                        ostringstream oss;

                        oss << Image::type_to_str(type)
                            << " Image '" << *it << "' not in READY state.";

                        error_str = oss.str();

                        return -1;
                    }

                }
            }
        }

        files_ds_parsed = oss_parsed.str();

        if ( !files_ds_parsed.empty() )
        {
            context->replace("FILES_DS", files_ds_parsed);
        }
    }

    // -------------------------------------------------------------------------
    // OneGate URL
    // -------------------------------------------------------------------------
    if ( generate_token_context(context, error_str) != 0 )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Virtual Router attributes
    // -------------------------------------------------------------------------
    string st;

    for (int i = 0; i < NUM_VROUTER_ATTRIBUTES; i++)
    {
        obj_template->get(VROUTER_ATTRIBUTES[i], st);

        if (!st.empty())
        {
            context->replace(VROUTER_ATTRIBUTES[i], st);
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_context_variables(VectorAttribute ** context,
        string& error_str)
{
    int rc;

    string   parsed;
    string * str = (*context)->marshall();

    if (str == 0)
    {
        return -1;
    }

    rc = parse_template_attribute(*str, parsed, error_str);

    delete str;

    if (rc != 0)
    {
        return -1;
    }

    *context = new VectorAttribute("CONTEXT");
    (*context)->unmarshall(parsed);

    obj_template->erase("CONTEXT");
    obj_template->set(*context);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

static void clear_context_network(const char* vars[][2], int num_vars,
        VectorAttribute * context, int nic_id)
{
    ostringstream att_name;

    for (int i=0; i < num_vars; i++)
    {
        att_name.str("");

        att_name << "ETH" << nic_id << "_" << vars[i][0];

        context->remove(att_name.str());
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_nic_context(int nicid)
{
    VectorAttribute * context = obj_template->get("CONTEXT");

    if (context == 0)
    {
        return;
    }

    clear_context_network(NETWORK_CONTEXT, NUM_NETWORK_CONTEXT, context, nicid);
    clear_context_network(NETWORK6_CONTEXT,NUM_NETWORK6_CONTEXT, context,nicid);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

