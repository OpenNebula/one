// ------------------------------------------------------------------------ //
// Copyright 2010-2014, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the Apache License, Version 2.0 (the "License"); you may  //
// not use this file except in compliance with the License. You may obtain  //
// a copy of the License at                                                 //
//                                                                          //
// http://www.apache.org/licenses/LICENSE-2.0                               //
//                                                                          //
// Unless required by applicable law or agreed to in writing, software      //
// distributed under the License is distributed on an "AS IS" BASIS,        //
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. //
// See the License for the specific language governing permissions and      //
// limitations under the License.                                           //
//------------------------------------------------------------------------- //

var support_tab = {
    title: '<hr><i class="fa fa-lg fa-fw fa-support"></i>&emsp;'+tr("Support"),
    no_content: true
}

var doc_tab = {
    title: tr("Documentation"),
    tabClass: 'subTab',
    parentTab: 'support-tab',
    no_content: true
}

var community_tab = {
    title: tr("Community"),
    tabClass: 'subTab',
    parentTab: 'support-tab',
    no_content: true
}

var enterprise_tab = {
    title: tr("Enterprise"),
    tabClass: 'subTab',
    parentTab: 'support-tab',
    no_content: true
}

Sunstone.addMainTab('support-tab',support_tab);
Sunstone.addMainTab('doc-tab',doc_tab);
Sunstone.addMainTab('community-tab',community_tab);
Sunstone.addMainTab('enterprise-tab',enterprise_tab);

$(document).on("click", "#li_doc-tab a", function(){
    window.open("http://docs.opennebula.org/4.6/");
    return false;
})

$(document).on("click", "#li_community-tab a", function(){
    window.open("http://opennebula.org/support/community/");
    return false;
})

$(document).on("click", "#li_enterprise-tab a", function(){
    window.open("http://c12g.com/support/");
    return false;
})
