if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  Rules Panel
//******************************************************************************
/**
 *   Panel used to view and manage rules
 *
 ******************************************************************************/

javaxt.express.finance.Rules = function(parent, config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {
        style: javaxt.express.finance.style
    };

    var win, grid, ruleEditor;
    var addButton, editButton, deleteButton;
    var accounts;
    var filter = {};


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


        accounts = orgConfig.accounts;


      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;


      //Row 1
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.className = "panel-toolbar";
        tr.appendChild(td);
        createToolbar(td);


      //Row 2
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        createBody(td);



      //Append table to parent
        if (parent){
            if (typeof parent === "string"){
                parent = document.getElementById(parent);
            }
            parent.appendChild(table);
        }
        else{

          //Create window
            var body = document.getElementsByTagName("body")[0];
            var buttonDiv = document.createElement("div");
            win = new javaxt.dhtml.Window(body, {
                title: "Rules",
                width: 800,
                height: 600,
                valign: "middle",
                modal: true,
                body: table,
                footer: buttonDiv,
                style: merge({
                    body: {
                        padding: "0px",
                        verticalAlign: "top",
                        color: "#484848"
                    }
                }, javaxt.express.finance.style.window)
            });

            buttonDiv.className = "button-div";
            buttonDiv.style.borderTop = "1px solid #dcdcdc";
            buttonDiv.style.paddingTop = "10px";
            var button = document.createElement("input");
            button.type = "button";
            button.name = button.value = "Close";
            button.className = "form-button";
            button.onclick = win.hide;
            buttonDiv.appendChild(button);
        }
    };


  //**************************************************************************
  //** show
  //**************************************************************************
    this.show = function(){
       if (win) win.show();
       else{

       }
    };


  //**************************************************************************
  //** hide
  //**************************************************************************
    this.hide = function(){
       if (win) win.hide();
       else{

       }
    };

  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        var toolbar = document.createElement('div');


      //Add button
        addButton = createButton(toolbar, {
            label: "Add",
            icon: "newIcon"
        });
        addButton.onClick = function(){
            editRule();
        };


      //Edit button
        editButton = createButton(toolbar, {
            label: "Edit",
            icon: "editIcon",
            disabled: true
        });
        editButton.onClick = function(){
            var records = grid.getSelectedRecords();
            if (records.length>0) editRule(records[0]);
        };



      //Delete button
        deleteButton = createButton(toolbar, {
            label: "Delete",
            icon: "deleteIcon",
            disabled: true
        });
        deleteButton.onClick = function(){
            var records = grid.getSelectedRecords();
            if (records.length>0) deleteRule(records[0]);
        };


        createSpacer(toolbar);



      //Refresh button
        var refreshButton = createButton(toolbar, {
            label: "Refresh",
            icon: "refreshIcon",
            disabled: false,
            hidden: false
        });
        refreshButton.onClick = function(){
            grid.refresh();
        };


        parent.appendChild(toolbar);
    };


  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){


        filter.orderby = "name desc";

        grid = new javaxt.dhtml.DataGrid(parent, {
            style: config.style.table,
            url: "rules",
            filter: filter,
            parseResponse: parseResponse,
            columns: [
                {header: 'Name', width:'90'},
                {header: 'Trigger', width:'100%'},
                {header: 'Assign To', width:'240'}
            ],
            update: function(row, rule){
                row.set('Name', rule.name);
                var info = rule.info;
                if (info){
                    var trigger = "If \"" + info.field + "\" " + info.filter.toLowerCase() + " \"" + info.keyword + "\"";
                    row.set('Trigger', trigger);

                    var categoryID = info.categoryID;
                    for (var i=0; i<accounts.length; i++){
                        var account = accounts.get(i);
                        if (account.categories){
                            for (var j=0; j<account.categories.length; j++){
                                var category = account.categories.get(j);
                                if (category.id===categoryID){
                                    row.set('Assign To', account.name + "/" + category.name);
                                    i = accounts.length;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        });


        grid.onSelectionChange = function(){
             var records = grid.getSelectedRecords();
             if (records.length>0){
                 editButton.enable();
                 deleteButton.enable();
             }
             else{
                 editButton.disable();
                 deleteButton.disable();
             }
        };


        grid.update = function(){
            grid.clear();
            grid.load();
        };


        grid.update();
    };


  //**************************************************************************
  //** editRule
  //**************************************************************************
    var editRule = function(rule){


      //Instantiate rule editor as needed
        if (!ruleEditor){
            ruleEditor = new javaxt.express.finance.RuleEditor({
                accounts: accounts,
                style: javaxt.express.finance.style
            });
            ruleEditor.onSubmit = function(){
                var rule = ruleEditor.getValues();
                save("rule", JSON.stringify(rule), {
                    success: function(id){
                        ruleEditor.close();
                        grid.update();
                    },
                    failure: function(request){
                        alert(request);
                    }
                });
            };
        }


      //Clear/reset the form
        ruleEditor.clear();


      //Updated values
        if (rule){
            ruleEditor.setTitle("Edit Rule");
            ruleEditor.setValue("id", rule.id);
            ruleEditor.setValue("name", rule.name);
            ruleEditor.setValue("description", rule.description);
            ruleEditor.setValue("active", rule.active);
            var info = rule.info;
            for (var key in info) {
                if (info.hasOwnProperty(key)){
                    var value = info[key];
                    ruleEditor.setValue(key, value);
                }
            }
        }
        else{
            ruleEditor.setTitle("New Rule");
            ruleEditor.setValue("active", true);
        }


      //Show the form
        ruleEditor.show();
    };


  //**************************************************************************
  //** deleteRule
  //**************************************************************************
    var deleteRule = function(rule){
        del("rule/" + rule.id, {
            success: function(){
                grid.update();
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(parent, btn){
        var defaultStyle = JSON.parse(JSON.stringify(config.style.toolbarButton));
        if (btn.style) btn.style = merge(btn.style, defaultStyle);
        else btn.style = defaultStyle;
        return javaxt.express.finance.utils.createButton(parent, btn);
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var save = javaxt.dhtml.utils.post;
    var del = javaxt.dhtml.utils.delete;
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createSpacer = javaxt.express.finance.utils.createSpacer;
    var parseResponse = javaxt.express.finance.utils.normalizeResponse;


    init();
};