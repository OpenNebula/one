module Oned =
  autoload xfm

(* Version: 1.1 *)

(* primitives *)
let sep = del /[ \t]*=[ \t]*/ " = "
let eol = del /\n/ "\n"
let opt_space = del /[ \t]*/ ""
let opt_space_nl = del /[ \t\n]*/ "\n"
let opt_nl_indent = del /[ \t\n]*/ "\n    "
let comma = del /,/ ","
let left_br = del /\[/ "["
let right_br = del /\]/ "]"

(* Regexes *)
(* Match everyhting within quotes *)
let re_quoted_str = /"[^\"]*"/

(* Match everything except spaces, quote("), l-bracket([) and num-sign(#) *)
let re_value_str = /[^ \t\n"\[#]+/

(* Match everything except spaces, quote("), num-sign(#) and comma(,) *)
let re_section_value_str = /[^ \t\n"#,]+/

(* Store either after-value comment or full-line comment *)
let comment = [ label "#comment" . store /#[^\n]*/ ]
let comment_eol = comment . eol


(* Simple words *)
let name = key /[A-Za-z_0-9]+/
let re_simple_value = re_quoted_str | re_value_str


(* Top level entry like `PORT = 2633` *)
let top_level_entry  = name . sep . store re_simple_value
let top_level_line =  opt_space
                      . [ top_level_entry . opt_space . (comment)? ]
                      . eol


(* Section lens for section like `LOG = [ ... ]` *)
let section_value = re_quoted_str | re_section_value_str
let section_entry = [ name . sep . store section_value ]
let section_entry_list =
    ( section_entry . opt_space . comma . opt_nl_indent
      | comment_eol . opt_space )*
    . section_entry . opt_space_nl
    . ( comment_eol )*

let section = opt_space
              . [ name . sep
              . left_br
                . opt_nl_indent
                . section_entry_list
              . right_br ]
              . eol

let empty_line = [ del /[ \t]*\n/ "\n" ]

(* Main lens *)
let lns = ( top_level_line | comment_eol | section | empty_line )*


(* Variable: filter *)
let filter = incl "/etc/one/oned.conf"
             . incl "/etc/one/sched.conf"
             . incl "/etc/one/vmm_exec/vmm_exec_kvm.conf"

let xfm = transform lns filter
