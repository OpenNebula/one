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

%code requires {
#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <algorithm>

#include <ctype.h>
#include <string.h>

#include "ImagePool.h"
#include "UserPool.h"
#include "VirtualMachine.h"
#include "Nebula.h"

#include "mem_collector.h"

using namespace std;

typedef void * yyscan_t;

int vm_file_var_parse (VirtualMachine * vm, vector<int> * img_ids,
    char ** errmsg, yyscan_t scanner);
}

%{
#include "vm_file_var_syntax.h"
#include "vm_var_parser.h"

#define YYERROR_VERBOSE
#define vm_file_var_lex vm_var_lex

void vm_file_var_error(YYLTYPE * llocp, mem_collector *  mc, VirtualMachine * vm,
    vector<int> * img_ids, char ** errmsg, yyscan_t scanner, const char * str);

int vm_var_lex(YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector * mc,
    yyscan_t scanner);

int vm_file_var_parse (VirtualMachine * vm, vector<int> * img_ids,
    char ** errmsg, yyscan_t scanner)
{
    mem_collector mc;
    int           rc;

    mem_collector_init(&mc);

    rc = vm_file_var_parse(&mc, vm, img_ids, errmsg, scanner);

    mem_collector_cleanup(&mc);

    return rc;
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
    unique_ptr<Image> img;
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

            VirtualMachineDisk file_disk(vfile, 0);
            uid   = file_disk.get_uid(uid);

            delete vfile;
        }

        img = ipool->get_ro(val1, uid);

        if ( img == nullptr )
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
        istringstream is(val1);

        is >> iid;

        if ( !is.fail() )
        {
            img = ipool->get_ro(iid);
        }

        if ( img == nullptr )
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

    set<int> gids;

    if (auto user = upool->get_ro(vm->get_uid()))
    {
        gids = user->get_groups();
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
%parse-param {char **  errmsg}
%parse-param {yyscan_t scanner}

%lex-param {mem_collector * mc}
%lex-param {yyscan_t scanner}

%union {
    char * val_str;
    int    val_int;
    char   val_char;
};

%defines
%locations
%pure-parser
%name-prefix "vm_file_var_"
%output      "vm_file_var_syntax.cc"

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

        one_util::toupper(file);
        one_util::toupper(var1);

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

        one_util::toupper(file);
        one_util::toupper(var1);
        one_util::toupper(var2);

        if (get_image_path(vm, file, var1, val1, var2, val2, img_ids, result) == -1)
        {
            img_ids->clear();
            *errmsg = strdup(result.c_str());
            YYABORT;
        }
    }
    ;
%%

void vm_file_var_error(
    YYLTYPE *        llocp,
    mem_collector *  mc,
    VirtualMachine * vm,
    vector<int> *    img_ids,
    char **          error_msg,
    yyscan_t         scanner,
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
