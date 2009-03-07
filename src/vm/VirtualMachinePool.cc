/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#include "Nebula.h"
#include "VirtualMachinePool.h"
#include "vm_var_syntax.h"
extern "C"
{
    #include "vm_var_parser.h"
}
#include <sstream>

int VirtualMachinePool::allocate (
    int            uid,
    const  string& stemplate,
    int *          oid,
    bool           on_hold)
{
    VirtualMachine * vm;

    char *  error_msg;
    int     rc;

    vector<Attribute *> attrs;

    // ------------------------------------------------------------------------
    // Build a new Virtual Machine object
    // ------------------------------------------------------------------------
    vm = new VirtualMachine;

    if (on_hold == true)
    {
        vm->state = VirtualMachine::HOLD;
    }
    else
    {
        vm->state = VirtualMachine::PENDING;
    }

    vm->uid = uid;

    // ------------------------------------------------------------------------
    // Parse template and keep CONTEXT apart
    // ------------------------------------------------------------------------
    rc = vm->vm_template.parse(stemplate,&error_msg);

    if ( rc != 0 )
    {
        ostringstream oss;

        oss << error_msg;
        Nebula::log("ONE", Log::ERROR, oss);
        free(error_msg);

        return -2;
    }

    vm->vm_template.remove("CONTEXT",attrs);

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------
    *oid = PoolSQL::allocate(vm);

    if ( *oid == -1 )
    {
        return -1;
    }

    // ------------------------------------------------------------------------
    // Insert parsed context in the VM template and clean-up
    // ------------------------------------------------------------------------
    generate_context(*oid,attrs);

    for (int i = 0; i < (int) attrs.size() ; i++)
    {
        if (attrs[i] != 0)
        {
            delete attrs[i];
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_running(
    vector<int>&    oids)
{
    ostringstream   os;
    string          where;

    os << "state == " << VirtualMachine::ACTIVE
    << " and lcm_state == " << VirtualMachine::RUNNING;

    where = os.str();

    return PoolSQL::search(oids,VirtualMachine::table,where);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_pending(
    vector<int>&    oids)
{
    ostringstream   os;
    string          where;

    os << "state == " << VirtualMachine::PENDING;

    where = os.str();

    return PoolSQL::search(oids,VirtualMachine::table,where);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePool::generate_context(int vm_id, vector<Attribute *> attrs)
{
    VirtualMachine *  vm;
    VectorAttribute * context_parsed;
    VectorAttribute * context;

    string *          str;
    string            parsed;

    int               rc;

    char *            error_msg;

    if ( attrs.size() == 0 )
    {
        return;
    }

    context = dynamic_cast<VectorAttribute *>(attrs[0]);

    if (context == 0)
    {
        return;
    }

    str = context->marshall(" @^_^@ ");

    if (str == 0)
    {
        return;
    }

    rc = parse_attribute(vm_id,*str,parsed,&error_msg);

    if ( rc != 0 )
    {
        if (error_msg != 0)
        {
            ostringstream oss;

            oss << error_msg << ": " << *str;
            free(error_msg);

            Nebula::log("ONE", Log::ERROR, oss);
        }

        delete str;

        return;
    }

    delete str;

    context_parsed = new VectorAttribute("CONTEXT");
    context_parsed->unmarshall(parsed," @^_^@ ");

    vm = get(vm_id,true);

    if ( vm == 0 )
    {
        delete context_parsed;
        return;
    }

    if ( vm->insert_template_attribute(db,context_parsed) != 0 )
    {
        delete context_parsed;
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

pthread_mutex_t VirtualMachinePool::lex_mutex = PTHREAD_MUTEX_INITIALIZER;

extern "C"
{
    int vm_var_parse (VirtualMachinePool * vmpool,
                      ostringstream *      parsed,
                      VirtualMachine *     vm,
                      char **              errmsg);

    int vm_var_lex_destroy();

    YY_BUFFER_STATE vm_var__scan_string(const char * str);

    void vm_var__delete_buffer(YY_BUFFER_STATE);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::parse_attribute(int     vm_id,
                                        string  &attribute,
                                        string  &parsed,
                                        char ** error_msg)
{
    YY_BUFFER_STATE  str_buffer;
    const char *     str;
    int              rc;
    VirtualMachine * vm;
    ostringstream    oss_parsed;

    *error_msg = 0;

    pthread_mutex_lock(&lex_mutex);

    vm = get(vm_id,true);

    if ( vm == 0 )
    {
        goto error_vm;
    }

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = vm_var_parse(this,&oss_parsed,vm,error_msg);

    vm_var__delete_buffer(str_buffer);

    vm_var_lex_destroy();

    vm->unlock();

    pthread_mutex_unlock(&lex_mutex);

    parsed = oss_parsed.str();

    return rc;

error_vm:
    *error_msg=strdup("Could not find virtual machine!");
    goto error_common;

error_yy:
    *error_msg=strdup("Error setting scan buffer");
    vm->unlock();
error_common:
    pthread_mutex_unlock(&lex_mutex);
    return -1;
}
