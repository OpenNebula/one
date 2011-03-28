/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

%{
#include <iostream>
#include <sstream>
#include <string>
#include <map>
#include <algorithm>

#include <ctype.h>
#include <string.h>

#include "vm_var_syntax.h"
#include "VirtualMachinePool.h"
#include "VirtualMachine.h"
#include "Nebula.h"

#define vm_var__lex vm_var_lex

#define YYERROR_VERBOSE
#define VM_VAR_TO_UPPER(S) transform (S.begin(),S.end(),S.begin(), \
(int(*)(int))toupper)

extern "C"
{
    #include "mem_collector.h"

    void vm_var__error(
        YYLTYPE *        llocp,
        mem_collector *  mc,
        VirtualMachine * vm,
        ostringstream *  parsed,
        char **          errmsg,
        const char *     str);

    int vm_var__lex (YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector * mc);

    int vm_var__parse (mem_collector *  mc,
                       VirtualMachine * vm,
                       ostringstream *  parsed,
                       char **          errmsg);

    int vm_var_parse (VirtualMachine * vm,
                      ostringstream *  parsed,
                      char **          errmsg)
    {
        mem_collector mc;
        int           rc;

        mem_collector_init(&mc);

        rc = vm_var__parse(&mc, vm, parsed, errmsg);

        mem_collector_cleanup(&mc);

        return rc;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void get_network_attribute(VirtualMachine * vm,
                           const string&    attr_name,
                           const string&    net_name,
                           const string&    net_value,
                           string&          attr_value)
{
    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();
    VirtualNetwork  *    vn;

    string  network = "";

    attr_value = "";

    if (net_name.empty())
    {
        vector<const Attribute *> nics;
        const VectorAttribute *   nic;

        if (vm->get_template_attribute("NIC",nics) == 0)
        {
            return;
        }

        nic = dynamic_cast<const VectorAttribute * >(nics[0]);

        if ( nic == 0 )
        {
            return;
        }

        network = nic->vector_value("NETWORK");
    }
    else if (net_name == "NAME")
    {
        network = net_value;
    }

    if ( network.empty() )
    {
        return;
    }

    vn = vnpool->get(network, vm->get_uid(), true);

    if ( vn == 0 )
    {
        return;
    }

    vn->get_template_attribute(attr_name.c_str(),attr_value);

    vn->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void insert_single(VirtualMachine * vm,
                   ostringstream&   parsed,
                   const string&    name)
{
    string value = "";

    vm->get_template_attribute(name.c_str(),value);

    parsed << value;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void insert_vector(VirtualMachine * vm,
                   ostringstream&   parsed,
                   const string&    name,
                   const string&    vname,
                   const string&    vvar,
                   const string&    vval)

{
    vector<const Attribute*> values;
    const VectorAttribute *  vattr = 0;

    int    num;

    if ( name == "NETWORK")
    {
        string value;

        get_network_attribute(vm,vname,vvar,vval,value);

        if (!value.empty())
        {
            parsed << value;
        }

        return;
    }

    if ( ( num = vm->get_template_attribute(name.c_str(),values) ) <= 0 )
    {
        return;
    }

    if ( vvar.empty() )
    {
        vattr = dynamic_cast<const VectorAttribute *>(values[0]);
    }
    else
    {
        const VectorAttribute * tmp = 0;

        for (int i=0 ; i < num ; i++)
        {
            tmp = dynamic_cast<const VectorAttribute *>(values[i]);

            if ( tmp && ( tmp->vector_value(vvar.c_str()) == vval ))
            {
                vattr = tmp;
                break;
            }
        }
    }

    if ( vattr != 0 )
    {
        parsed << vattr->vector_value(vname.c_str());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

%}

%parse-param {mem_collector * mc}
%parse-param {VirtualMachine * vm}
%parse-param {ostringstream *  parsed}
%parse-param {char **          errmsg}

%lex-param {mem_collector * mc}

%union {
    char * val_str;
    int    val_int;
    char   val_char;
};

%defines
%locations
%pure_parser
%name-prefix = "vm_var__"
%output      = "vm_var_syntax.cc"

%token EQUAL COMMA OBRACKET CBRACKET

%token <val_char> EOA
%token <val_str>  STRING
%token <val_str>  VARIABLE
%token <val_str>  RSTRING
%token <val_int>  INTEGER
%type  <void>	  vm_variable
%type  <void>     vm_string

%%

vm_string:  vm_variable
    | vm_string vm_variable
    ;

vm_variable:RSTRING
    {
        (*parsed) << $1;
    }
    | VARIABLE EOA
    {
        string name($1);

        VM_VAR_TO_UPPER(name);

        insert_single(vm,*parsed,name);

        if ( $2 != '\0' )
        {
            (*parsed) << $2;
        }
    }
    | VARIABLE OBRACKET VARIABLE CBRACKET EOA
    {
        string name($1);
        string vname($3);

        VM_VAR_TO_UPPER(name);
        VM_VAR_TO_UPPER(vname);

        insert_vector(vm,*parsed,name,vname,"","");

        if ( $5 != '\0' )
        {
            (*parsed) << $5;
        }
    }
    | VARIABLE OBRACKET VARIABLE COMMA VARIABLE EQUAL STRING CBRACKET EOA
    {
        string name($1);
        string vname($3);
        string vvar($5);
        string vval($7);

        VM_VAR_TO_UPPER(name);
        VM_VAR_TO_UPPER(vname);
        VM_VAR_TO_UPPER(vvar);

        insert_vector(vm,*parsed,name,vname,vvar,vval);

        if ( $9 != '\0' )
        {
            (*parsed) << $9;
        }
    }
    ;
%%

extern "C" void vm_var__error(
    YYLTYPE *        llocp,
    mem_collector *  mc,
    VirtualMachine * vm,
    ostringstream *  parsed,
    char **          error_msg,
    const char *     str)
{
    int length;

    length = strlen(str)+ 64;

    *error_msg = (char *) malloc(sizeof(char)*length);

    if (*error_msg != 0)
    {
        snprintf(*error_msg,
            length,
            "%s at line %i, columns %i:%i",
            str,
            llocp->first_line,
            llocp->first_column,
            llocp->last_column);
    }
}
