/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#define YYERROR_VERBOSE
#define VM_VAR_TO_UPPER(S) transform (S.begin(),S.end(),S.begin(), \
(int(*)(int))toupper)

extern "C"
{
void vm_var_error(
    YYLTYPE *        llocp,
    VirtualMachine * vm,
    int              vm_id,                  
    ostringstream *  parsed,
    char **          errmsg,
    const char *     str);

int vm_var_lex (YYSTYPE *lvalp, YYLTYPE *llocp);

int vm_var_parse (VirtualMachine * vm,
                  int              vm_id,                  
                  ostringstream *  parsed,
                  char **          errmsg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void insert_single(VirtualMachine * vm,
                   int              vm_id,
                   ostringstream&   parsed,
                   const string&    name)
{
    VirtualMachine * tvm = vm;
    string value = "";
    
    if ( vm == 0 )
    {
        Nebula& nd = Nebula::instance();

        tvm = nd.get_vmpool()->get(vm_id,true);
    }
    
    if ( tvm == 0 )
    {
        return;
    }

    tvm->get_template_attribute(name.c_str(),value);
                    
    parsed << value;
    
    if ( vm == 0 )
    {
        tvm->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void insert_vector(VirtualMachine * vm,
                   int              vm_id,
                   ostringstream&   parsed,
                   const string&    name,
                   const string&    vname,
                   const string&    vvar,
                   const string&    vval)
                   
{
    VirtualMachine * tvm = vm;
    
    vector<const Attribute*> values;
    const VectorAttribute *  vattr = 0;
    
    int    num;
    string value = "";
    
    if ( vm == 0 )
    {
        Nebula& nd = Nebula::instance();
        
        tvm = nd.get_vmpool()->get(vm_id,true);
    }
    
    if ( tvm == 0 )
    {
        return;
    }

    if ( ( num = tvm->get_template_attribute(name.c_str(),values) ) <= 0 )
    {
        goto error_name;
    }
    
    if ( vvar.empty() )
    {
        vattr = dynamic_cast<const VectorAttribute *>(values[0]);        
    }
    else
    {
        const VectorAttribute *  tmp = 0;
                
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

error_name:                        
    if ( vm == 0 )
    {
        tvm->unlock();
    }
}
  
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

%}

%parse-param {VirtualMachine * vm}
%parse-param {int              vm_id}
%parse-param {ostringstream *  parsed}
%parse-param {char **          errmsg}

%union {
    char * val_str;
    int    val_int;
    char   val_char;
};

%defines
%locations
%pure_parser
%name-prefix = "vm_var_"
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
        free($1);
    }
    | VARIABLE EOA
    {
        string name($1);
        
        VM_VAR_TO_UPPER(name);
                            
        insert_single(vm,vm_id,*parsed,name);
                        
        if ( $2 != '\0' )
        {
            (*parsed) << $2;
        }
        
        free($1);
    }
    | VARIABLE OBRACKET VARIABLE CBRACKET EOA
    {
        string name($1);
        string vname($3);
        
        VM_VAR_TO_UPPER(name);
        VM_VAR_TO_UPPER(vname);

        insert_vector(vm,vm_id,*parsed,name,vname,"","");

        if ( $5 != '\0' )
        {
            (*parsed) << $5;
        }

        free($1);
        free($3);
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

        insert_vector(vm,vm_id,*parsed,name,vname,vvar,vval);
                                                              
        if ( $9 != '\0' )
        {
            (*parsed) << $9;
        }

        free($1);
        free($3);
        free($5);
        free($7);
    }
    | INTEGER VARIABLE EOA
    {
        string name("CONTEXT");
        string vname($2);

        VM_VAR_TO_UPPER(vname);
        
        insert_vector(0,$1,*parsed,name,vname,"","");
        
        if ( $3 != '\0' )
        {
            (*parsed) << $3;
        }

        free($2);
    }
    ;
%%

extern "C" void vm_var_error(
    YYLTYPE *        llocp,
    VirtualMachine * vm,
    int              vm_id,                  
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
