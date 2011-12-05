var lang=""
var lang_tmp="";
var locale = {};
var datatable_lang = "";

function tr(str){
    var tmp = locale[str];
    if ( tmp == null || tmp == "" ) {
        //console.debug("trans: "+str);
        tmp = str;
    }
    return tmp;
};

function setLang(lang_str){
    $('<div title="Changing language">Loading new language... please wait '+spinner+'</div>').dialog({
        draggable:false,
        modal:true,
        resizable:false,
        buttons:{},
        width: 460,
        minHeight: 50

    });

    lang_tmp = lang_str;

    var obj = {
        data : {
            id: uid,
        },
        success: updateUserTemplate
    };
    OpenNebula.User.show(obj);
};

function updateUserTemplate(request,user_json){
    var template = user_json.USER.TEMPLATE;
    template["LANG"] = lang_tmp;
    var template_str="";
    $.each(template,function(key,value){
        template_str += (key + '=' + '"' + value + '"\n');
    });

    var obj = {
        data: {
            id: uid,
            extra_param: template_str
        },
        error: onError
    };
    OpenNebula.User.update(obj);
    $.post('config',JSON.stringify({lang:lang_tmp}),refreshLang);
}

function refreshLang(){
    window.location.href = ".";
};

$(document).ready(function(){
    if (lang)
        $('#lang_sel option[value="'+lang+'"]').attr('selected','selected');
    $('#lang_sel').change(function(){
        setLang($(this).val());
    });

    $('#doc_link').text(tr("Documentation"));
    $('#support_link').text(tr("Support"));
    $('#community_link').text(tr("Community"));
    $('#welcome').text(tr("Welcome"));
    $('#logout').text(tr("Sign out"));
});