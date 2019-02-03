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

%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>

#include "template_syntax.h"
#include "mem_collector.h"

#define YY_NO_INPUT

#define YY_DECL int template_lex (YYSTYPE *yylval_param, YYLTYPE *llocp, \
                                  mem_collector *mc, yyscan_t yyscanner)

#define YY_USER_ACTION  llocp->first_line = yylineno;   \
                        llocp->first_column = llocp->last_column;   \
                        llocp->last_column += yyleng;
%}

%option nounput
%option prefix="template_"
%option outfile="template_parser.cc"
%option header-file="template_parser.h"
%option bison-bridge
%option yylineno
%option reentrant

%x VALUE

STRING [^=#[:blank:]\n,\[\]]+
VALUE_STRING ([^\"]|"\\\"")*
CDATA "\]\]\>"
%%

 /* ------------------------------------------------------------------------- */
 /* Comments (lines with an starting #), and empty lines                      */
 /* ------------------------------------------------------------------------- */
[[:blank:]]*#.*\n  ;
[[:blank:]\n]+    ;

 /* ------------------------------------------------------------------------- */
 /* Variable: Alpha numeric charatcers and '_'                                */
 /* ------------------------------------------------------------------------- */
[[:alnum:]_]+  { yylval_param->val_str = mem_collector_strdup(mc,yytext);
                 return VARIABLE; }

 /* ------------------------------------------------------------------------ */
 /* TOKENS                                                                   */
 /* Single attribute (VARIABLE = VALUE, also empty VAIABLE=)                */
 /* Vector attributes (VARIABLE = [ ATTR1 = VAL1, ATTR2 = VAL2 ])            */
 /* ------------------------------------------------------------------------ */
[[:blank:]]*=[[:blank:]]*           { BEGIN VALUE; return EQUAL;}

[[:blank:]]*=[[:blank:]]*\n         { return EQUAL_EMPTY;}

[[:blank:]\n]*,[[:blank:]\n]*       { return COMMA;}

[[:blank:]\n]*\][[:blank:]\n]*      { return CBRACKET;}

<VALUE>[[:blank:]]*\[[[:blank:]\n]* { BEGIN(INITIAL); return OBRACKET;}

 /* ------------------------------------------------------------------------ */
 /* Attribute values                                                         */
 /*   - String in double quoted form                                         */
 /*   - Anything but  =,][# and blanks                                       */
 /* ------------------------------------------------------------------------ */

<VALUE>.*{CDATA}.*   {
    BEGIN(INITIAL);
    return CCDATA;
}

<VALUE>\"{VALUE_STRING}\" {
    yylval_param->val_str = mem_collector_strdup(mc,yytext+1);
    yylval_param->val_str[yyleng-2] = '\0';
    BEGIN(INITIAL);
    return STRING;
}

<VALUE>{STRING}   {
    yylval_param->val_str = mem_collector_strdup(mc,yytext);
    BEGIN(INITIAL);
    return STRING;
}

%%

int template_wrap(yyscan_t scanner)
{
    return 1;
}
