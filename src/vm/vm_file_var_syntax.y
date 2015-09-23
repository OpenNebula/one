/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
#include <vector>
#include <string>
#include <map>
#include <algorithm>

#include <ctype.h>
#include <string.h>

#include "vm_file_var_syntax.h"
#include "ImagePool.h"
#include "UserPool.h"
#include "VirtualMachine.h"
#include "Nebula.h"

#define vm_file_var__lex vm_var_lex

#define YYERROR_VERBOSE
#define VM_VAR_TO_UPPER(S) transform (S.begin(),S.end(),S.begin(), \
(int(*)(int))toupper)

extern "C"
{
    #include "mem_collector.h"

    void vm_file_var__error(
        YYLTYPE *        llocp,
        mem_collector *  mc,
        VirtualMachine * vm,
        vector<int> *    img_ids,
        char **          errmsg,
        const char *     str);

    int vm_file_var__lex (YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector * mc);

    int vm_file_var__parse (mem_collector *  mc,
                            VirtualMachine * vm,
                            vector<int> *    img_ids,
                            char **          errmsg);

    int vm_file_var_parse (VirtualMachine * vm,
                           vector<int> *    img_ids,
                           char **          errmsg)
    {
        mem_collector mc;
        int           rc;

        mem_collector_init(&mc);

        rc = vm_file_var__parse(&mc, vm, img_ids, errmsg);

        mem_collector_cleanup(&mc);

        return rc;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int get_image_path(VirtualMachine * vm,
                   const string&    var_name,
                   const string&    var1,
                   const string&    val1,
                   const string&    var2,
                   const string&    val2,
                   vector<int> *    img_ids,
                   string&          error_str)
{
    Nebula& nd = Nebula::instance();

    ImagePool * ipool = nd.get_ipool();
    UserPool *  upool = nd.get_upool();
    Image  *    img   = 0;
    User  *     user  = 0;
    int         iid   = -1;

    PoolObjectAuth  perm;

    if (var_name != "FILE" )
    {
        error_str = "Must use FILE variable for attribute.";
        return -1;
    }

    if ( var1 == "IMAGE" )
    {
        int uid = vm->get_uid();

        if ( !var2.empty() )
        {
            VectorAttribute *  vfile;
            map<string,string> file_values;

            file_values.insert(make_pair(var1, val1));
            file_values.insert(make_pair(var2, val2));

            vfile = new VectorAttribute("FILE", file_values);
            uid   = ImagePool::get_disk_uid(vfile, uid);

            delete vfile;
        }

        img = ipool->get(val1, uid, true);

        if ( img == 0 )
        {
            ostringstream oss;
            oss << "User " << uid << " does not own an image with name: " << val1
                << " . Set IMAGE_UNAME or IMAGE_UID of owner.";

            error_str = oss.str();

            return -1;
        }
    }
    else if ( var1 == "IMAGE_ID" )
    {
        iid = ImagePool::get_disk_id(val1);

        if ( iid != -1 )
        {
            img = ipool->get(iid, true);
        }

        if ( img == 0 )
        {
            ostringstream oss;
            oss << "Image with ID: " << iid  << " does not exist";

            error_str = oss.str();

            return -1;
        }
    }
    else
    {
        error_str = "Cannot get image, set IMAGE_ID or IMAGE.";
        return -1;
    }

    iid = img->get_oid();

    img->get_permissions(perm);

    img->unlock();

    set<int> gids;

    user = upool->get(vm->get_uid(), true);

    if (user != 0)
    {
        gids = user->get_groups();
        user->unlock();
    }
    else
    {
        gids.insert(vm->get_gid());
    }

    AuthRequest ar(vm->get_uid(), gids);

    ar.add_auth(AuthRequest::USE, perm);

    if (UserPool::authorize(ar) == -1)
    {
        error_str = "User not authorize to use image.";
        return -1;
    }

    img_ids->push_back(iid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

%}

%parse-param {mem_collector *  mc}
%parse-param {VirtualMachine * vm}
%parse-param {vector<int> *    img_ids}
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
%name-prefix = "vm_file_var__"
%output      = "vm_file_var_syntax.cc"

%token EQUAL COMMA OBRACKET CBRACKET

%token <val_char> EOA
%token <val_str>  STRING
%token <val_str>  VARIABLE
%token <val_str>  RSTRING
%token <val_int>  INTEGER
%type  <void>     vm_variable
%type  <void>     vm_string

%%

vm_string:  vm_variable
    | vm_string vm_variable
    ;

vm_variable:
    VARIABLE OBRACKET VARIABLE EQUAL STRING CBRACKET EOA
    {
        string file($1);
        string var1($3);
        string val1($5);

        string result;

        VM_VAR_TO_UPPER(file);
        VM_VAR_TO_UPPER(var1);

        if (get_image_path(vm, file, var1, val1, "", "", img_ids, result) == -1)
        {
            img_ids->clear();
            *errmsg = strdup(result.c_str());
            YYABORT;
        }
    }
    | VARIABLE OBRACKET VARIABLE EQUAL STRING COMMA VARIABLE EQUAL STRING CBRACKET EOA
    {
        string file($1);
        string var1($3);
        string val1($5);
        string var2($7);
        string val2($9);

        string result;

        VM_VAR_TO_UPPER(file);
        VM_VAR_TO_UPPER(var1);
        VM_VAR_TO_UPPER(var2);

        if (get_image_path(vm, file, var1, val1, var2, val2, img_ids, result) == -1)
        {
            img_ids->clear();
            *errmsg = strdup(result.c_str());
            YYABORT;
        }
    }
    ;
%%

extern "C" void vm_file_var__error(
    YYLTYPE *        llocp,
    mem_collector *  mc,
    VirtualMachine * vm,
    vector<int> *    img_ids,
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
