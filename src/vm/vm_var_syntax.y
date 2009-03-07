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

#define YYERROR_VERBOSE
#define VM_VAR_TO_UPPER(S) transform (S.begin(),S.end(),S.begin(), \
(int(*)(int))toupper)

extern "C"
{
void vm_var_error(
    YYLTYPE *            llocp,
    VirtualMachinePool * vmpool,
    ostringstream *      parsed,
    VirtualMachine *     vm,
    char **              error_msg,
    const char *         str);

int vm_var_lex (YYSTYPE *lvalp, YYLTYPE *llocp);

int vm_var_parse (VirtualMachinePool * vmpool,
                  ostringstream *      parsed,
                  VirtualMachine *     vm,
                  char **              errmsg);
}

%}

%parse-param {VirtualMachinePool * vmpool}
%parse-param {ostringstream *      parsed}
%parse-param {VirtualMachine *     vm}
%parse-param {char **              errmsg}

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

%token <val_char>   BLANK
%token <val_str>  	STRING
%token <val_str>    RSTRING
%token <val_int>    INTEGER
%type  <void>		vm_variable
%type  <void>   	vm_string

%%

vm_string:  vm_variable
    | vm_string vm_variable
    ;

vm_variable:RSTRING
            {
                (*parsed) << $1;
                free($1);
            }
            | STRING BLANK
            {
                string name($1);
                string value = "";

                VM_VAR_TO_UPPER(name);

                vm->get_template_attribute(name.c_str(),value);

                if (!value.empty())
                {
                    (*parsed) << value;
                }

                if ( $2 != '\0' )
                {
                    (*parsed) << $2;
                }

                free($1);
            }
            | STRING OBRACKET STRING CBRACKET BLANK
            {
                vector<const Attribute*> values;
                const VectorAttribute *  vattr;
                string value = "";

                string name($1);
                string vname($3);

                VM_VAR_TO_UPPER(name);
                VM_VAR_TO_UPPER(vname);

                if ( vm->get_template_attribute(name,values) > 0 )
                {
                    vattr = dynamic_cast<const VectorAttribute *>(values[0]);

                    if (vattr)
                    {
                        value = vattr->vector_value(vname.c_str());
                    }
                }

                if ( !value.empty() )
                {
                    (*parsed) << value;
                }

                if ( $5 != '\0' )
                {
                    (*parsed) << $5;
                }

                free($1);
                free($3);
            }
            | STRING OBRACKET STRING COMMA STRING EQUAL STRING CBRACKET BLANK
            {
                vector<const Attribute*> values;
                const VectorAttribute *  vattr;

                string value = "";

                string name($1);
                string vname($3);
                string vvar($5);

                VM_VAR_TO_UPPER(name);
                VM_VAR_TO_UPPER(vname);
                VM_VAR_TO_UPPER(vvar);

                int num = vm->get_template_attribute(name,values);

                for (int i=0 ; i < num ; i++)
                {
                    vattr = dynamic_cast<const VectorAttribute *>(values[i]);

                    if (vattr && (vattr->vector_value(vvar.c_str())== $7))
                    {
                        value = vattr->vector_value(vname.c_str());
                        break;
                    }
                }

                if ( !value.empty() )
                {
                    (*parsed) << value;
                }

                if ( $9 != '\0' )
                {
                    (*parsed) << $9;
                }

                free($1);
                free($3);
                free($5);
                free($7);
            }
            | INTEGER STRING BLANK
            {
                string name($2);
                string value = "";

                VirtualMachine *         tvm;
                vector<const Attribute*> values;
                const VectorAttribute *  vattr;

                tvm = vmpool->get($1,true);

                if ( tvm != 0 )
                {
                    VM_VAR_TO_UPPER(name);

                    if ( tvm->get_template_attribute("CONTEXT",values) > 0 )
                    {
                        vattr=dynamic_cast<const VectorAttribute *> (values[0]);

                        if (vattr)
                        {
                            value = vattr->vector_value(name.c_str());
                        }
                    }

                    tvm->unlock();
                }

                if ( !value.empty() )
                {
                    (*parsed) << value;
                }

                if ( $3 != '\0' )
                {
                    (*parsed) << $3;
                }

                free($2);
            }
            ;
%%

extern "C" void vm_var_error(
    YYLTYPE *            llocp,
    VirtualMachinePool * vmpool,
    ostringstream *      parsed,
    VirtualMachine *     vm,
    char **              error_msg,
    const char *         str)
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
