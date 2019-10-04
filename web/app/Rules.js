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
    var defaultConfig = {
        style: javaxt.express.finance.style
    };
    
    var win;
    
    
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
            win = new javaxt.dhtml.Window(body, {
                title: "Rules",
                width: 800,
                height: 600,
                valign: "middle",
                modal: true,
                body: table,
                style: merge({
                    body: {
                        padding: "0px",
                        verticalAlign: "top",
                        color: "#484848"
                    }
                }, javaxt.express.finance.style.window)
            });
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
        var addButton = createButton(toolbar, {
            label: "Add",
            menu: true,
            icon: "newIcon",
            disabled: false
        });
        addButton.onClick = function(){

        };


      //Edit button
        var editButton = createButton(toolbar, {
            label: "Edit",
            icon: "editIcon",
            toggle: true,
            disabled: false
        });
        editButton.onClick = function(){
            if (this.isSelected()){
                transactionEditor.show();
            }
            else{
                transactionEditor.hide();
            }
        };



      //Delete button
        var deleteButton = createButton(toolbar, {
            label: "Delete",
            icon: "deleteIcon",
            disabled: true
        });
        deleteButton.onClick = function(){

        };


        createSpacer(toolbar);



      //Add button
        var runButton = createButton(toolbar, {
            label: "Rules",
            icon: "runIcon",
            disabled: false
        });
        runButton.onClick = function(){
            if (!rules) rules = new javaxt.express.finance.Rules();
            console.log(rules);
            rules.show();
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
            transactionGrid.refresh();
        };


        parent.appendChild(toolbar);
    };
    
    
  //**************************************************************************
  //** createBody
  //**************************************************************************
    var createBody = function(parent){
        
    };
    
    
  //**************************************************************************
  //** createButton
  //**************************************************************************
    var createButton = function(toolbar, btn){
        btn.style = JSON.parse(JSON.stringify(config.style.toolbarButton));
        return javaxt.express.finance.utils.createButton(toolbar, btn);
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


    var isNumber = javaxt.express.finance.utils.isNumber;
    var formatCurrency = javaxt.express.finance.utils.formatCurrency;
    var getMomentFormat = javaxt.express.finance.utils.getMomentFormat;

    var parseResponse = javaxt.express.finance.utils.normalizeResponse;


    init();
};