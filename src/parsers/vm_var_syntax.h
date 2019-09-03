/* A Bison parser, made by GNU Bison 3.4.1.  */

/* Bison interface for Yacc-like parsers in C

   Copyright (C) 1984, 1989-1990, 2000-2015, 2018-2019 Free Software Foundation,
   Inc.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* Undocumented macros, especially those whose name start with YY_,
   are private implementation details.  Do not rely on them.  */

#ifndef YY_VM_VAR_VM_VAR_SYNTAX_HH_INCLUDED
# define YY_VM_VAR_VM_VAR_SYNTAX_HH_INCLUDED
/* Debug traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif
#if YYDEBUG
extern int vm_var_debug;
#endif
/* "%code requires" blocks.  */
#line 17 "vm_var_syntax.y"

#include <iostream>
#include <sstream>
#include <string>
#include <map>
#include <algorithm>

#include <ctype.h>
#include <string.h>

#include "VirtualMachinePool.h"
#include "VirtualMachine.h"
#include "Nebula.h"

#include "mem_collector.h"

typedef void * yyscan_t;

int vm_var_parse (VirtualMachine * vm, ostringstream * parsed, char ** errmsg,
    yyscan_t scanner);

#line 70 "vm_var_syntax.hh"

/* Token type.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
  enum yytokentype
  {
    EQUAL = 258,
    COMMA = 259,
    OBRACKET = 260,
    CBRACKET = 261,
    EOA = 262,
    STRING = 263,
    VARIABLE = 264,
    RSTRING = 265,
    INTEGER = 266
  };
#endif

/* Value type.  */
#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
union YYSTYPE
{
#line 432 "vm_var_syntax.y"

    char * val_str;
    int    val_int;
    char   val_char;

#line 99 "vm_var_syntax.hh"

};
typedef union YYSTYPE YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define YYSTYPE_IS_DECLARED 1
#endif

/* Location type.  */
#if ! defined YYLTYPE && ! defined YYLTYPE_IS_DECLARED
typedef struct YYLTYPE YYLTYPE;
struct YYLTYPE
{
  int first_line;
  int first_column;
  int last_line;
  int last_column;
};
# define YYLTYPE_IS_DECLARED 1
# define YYLTYPE_IS_TRIVIAL 1
#endif



int vm_var_parse (mem_collector * mc, VirtualMachine * vm, ostringstream * parsed, char ** errmsg, yyscan_t scanner);

#endif /* !YY_VM_VAR_VM_VAR_SYNTAX_HH_INCLUDED  */
