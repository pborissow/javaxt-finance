if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  SourceManager
//******************************************************************************
/**
 *   Panel used to view and edit source accounts, templates, and vendors
 *
 ******************************************************************************/

javaxt.express.finance.SourceManager = function(parent, config) {

    var me = this;
    var orgConfig = config ? config : {};
    var defaultConfig = {
        style: javaxt.express.finance.style
    };
    defaultConfig.style.border = "1px solid #ccc";
    defaultConfig.style.form.padding = "15px 20px 0 15px";

    var isMobile = false;

    var waitmask;
    var addButton, editButton, deleteButton; //Buttons
    var grid, grid2; //DataGrids
    var editor;
    var vendors; //DataStore


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    var init = function(){

        if (typeof parent === "string"){
            parent = document.getElementById(parent);
        }
        if (!parent) return;


      //Clone the config so we don't modify the original config object
        var clone = {};
        merge(clone, config);


      //Merge clone with default config
        merge(clone, defaultConfig);
        config = clone;


      //Get or create animation effects
        if (!config.fx) config.fx = new javaxt.dhtml.Effects();



      //Create main div
        var div = document.createElement("div");
        div.style.position = "relative";
        div.style.height = "100%";
        parent.appendChild(div);
        me.el = div;


      //Create waitmask
        waitmask = createWaitMask(div);


      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;



      //Row 1
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.className = "panel-toolbar";
        tr.appendChild(td);
        createToolbar(td);


      //Row 2
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);
        createPanels(td);


        div.appendChild(table);





      //Get or create datastore for vendors
        getDataStore("vendors", orgConfig, function(){
            vendors = orgConfig.vendors;

            /*
            vendors.addEventListener("add", function(vendor){
            }, me);

            vendors.addEventListener("remove", function(vendor){
            }, me);

            vendors.addEventListener("update", function(vendor, orgVendor){
            }, me);
            */
        });
    };


  //**************************************************************************
  //** createToolbar
  //**************************************************************************
    var createToolbar = function(parent){
        var toolbar = document.createElement('div');


      //Add button
        addButton = createButton(toolbar, {
            label: "Add",
            icon: "newIcon",
            hidden: isMobile,
            disabled: true
        });
        addButton.onClick = function(){
            grid2.deselectAll();
            createItem();
        };


      //Edit button
        editButton = createButton(toolbar, {
            label: "Edit",
            icon: "editIcon",
            toggle: true,
            disabled: true
        });



      //Delete button
        deleteButton = createButton(toolbar, {
            label: "Delete",
            icon: "deleteIcon",
            disabled: true
        });
        deleteButton.onClick = function(){
            deleteItem();
        };


        createSpacer(toolbar);


      //Refresh button
        var refreshButton = createButton(toolbar, {
            label: "Refresh",
            icon: "refreshIcon",
            disabled: false,
            hidden: isMobile
        });
        refreshButton.onClick = function(){
            grid.deselectAll();
        };


        parent.appendChild(toolbar);
    };


  //**************************************************************************
  //** createPanels
  //**************************************************************************
    var createPanels = function(parent){
        var table = createTable();
        var tbody = table.firstChild;
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td;


        var style = merge({
            headerColumn : "table-header-col no-border"
        }, config.style.table);


        td = document.createElement("td");
        tr.appendChild(td);
        grid = new javaxt.dhtml.DataGrid(td, {
            style: style,
            columns: [
                {header: 'Category', width:'100%'}
            ]
        });
        grid.load([['Accounts'],['Templates'],['Vendors']]);
        grid.onSelectionChange = function(){

            editor.clear();

            addButton.enable();
            editButton.disable();
            deleteButton.disable();


          //Update grid
            var arr = grid.getSelectedRecords();
            if (arr.length>0){
                var selectedRecord = arr[0][0];
                if (selectedRecord==="Vendors"){
                    grid2.load(vendors);
                }
                else{
                    get("Source"+selectedRecord + "?orderby=" + (selectedRecord==="Accounts" ? "accountName" : "name"),{
                        success: function(text){
                            grid2.load(normalizeResponse(text));
                        }
                    });
                }
            }
        };
        grid.onKeyEvent = function(keyCode){
            if (keyCode===39){
                grid2.focus();
                if (grid2.getSelectedRecords().length===0){
                    grid2.forEachRow(function (row) {
                        row.click();
                        return true;
                    });
                }
            }
        };

        td = document.createElement("td");
        td.style.borderLeft =
        td.style.borderRight = config.style.border;
        tr.appendChild(td);
        grid2 = new javaxt.dhtml.DataGrid(td, {
            style: style,
            columns: [
                {header: 'Name', width:'100%'}
            ],
            update: function(row, data){
                for (var key in data) {
                    if (data.hasOwnProperty(key)){
                        if (key.toLowerCase().indexOf("name")>-1){
                            var name = data[key];
                            row.set(0, name);
                            break;
                        }
                    }
                }
            }
        });
        grid2.onSelectionChange = function(){
            addButton.enable();

            if (grid2.getSelectedRecords().length===0){
                editor.clear();
            }
            else{
                editSelectedItem();
            }
        };
        grid2.onKeyEvent = function(keyCode){
            if (keyCode===37){
                grid2.deselectAll();
                grid.focus();
            }
        };

        td = document.createElement("td");
        td.style.width = "34%";
        tr.appendChild(td);
        createEditor(td);


        parent.appendChild(table);
    };


  //**************************************************************************
  //** create/edit item
  //**************************************************************************
    var createItem = editSelectedItem = function(){
        var model = grid.getSelectedRecords()[0][0];
        var data = grid2.getSelectedRecords()[0];
        if (model=="Accounts"){
            editAccount(data);
        }
        else if (model=="Templates"){
            editTemplate(data);
        }
        else if (model=="Vendors"){
            editVendor(data);
        }
    };


  //**************************************************************************
  //** deleteItem
  //**************************************************************************
    var deleteItem = function(){
        var model = grid.getSelectedRecords()[0][0];
        var data = grid2.getSelectedRecords()[0];
        if (data){
            waitmask.show();
            model = model.substring(0, model.length-1); //remove "s"
            if (model!=="Vendor"){
                model = "Source" + model;
            }
            del(model+"?id="+data.id, {
                success: function(){
                    if (model==="Vendor"){
                        vendors.remove(data);
                    }
                    else{
                        grid.onSelectionChange(); //force reload
                    }
                    waitmask.hide();
                },
                failure: function(){
                    waitmask.hide();
                }
            });
        }
    };


  //**************************************************************************
  //** createEditor
  //**************************************************************************
    var createEditor = function(parent){
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;


        tr = document.createElement("tr");
        tbody.appendChild(tr);
        tr.className = "table-header";
        td = document.createElement("td");
        td.className = "table-header-col no-border noselect";
        td.innerHTML = "Editor";
        tr.appendChild(td);
        var header = td;


        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "100%";
        td.style.verticalAlign = "top";
        tr.appendChild(td);


        var body = document.createElement("div");
        setStyle(body, config.style.form);
        td.appendChild(body);


        parent.appendChild(table);


        editor = {
            setTitle: function(title){
                header.innerHTML = title;
            },
            clear: function(){
                body.innerHTML = "";
            },
            getBody: function(){
                return body;
            }
        };
    };



  //**************************************************************************
  //** editAccount
  //**************************************************************************
    var editAccount = function(sourceAccount){
        editor.clear();

        var vendorField;
        if (sourceAccount){
            vendorField = "text";
        }
        else{
            var div = document.createElement("div");
            vendorField = new javaxt.dhtml.ComboBox(div, {
                maxVisibleRows: 5,
                style: config.style.combobox
            });
        }

        var form = new javaxt.dhtml.Form(editor.getBody(), {
            style: config.style.form,
            items: [
                {
                    name: "vendor",
                    label: "Vendor Name",
                    type: vendorField
                },
                {
                    name: "name",
                    label: "Account Name",
                    type: "text"
                },
                {
                    name: "number",
                    label: "Account Number",
                    type: "text"
                },
                {
                    name: "active",
                    label: "Active",
                    type: "radio",
                    alignment: "vertical",
                    options: [
                        {
                            label: "True",
                            value: true
                        },
                        {
                            label: "False",
                            value: false
                        }
                    ]
                }
            ],
            buttons: [
                {
                    name: "Reset",
                    onclick: function(){
                        reset();
                    }
                },
                {
                    name: "Save",
                    onclick: function(){

                      //Get form data
                        var account = form.getData();


                      //Validate inputs
                        if (!account.vendor){
                            warn("Vendor is required", form.findField("vendor"));
                            return;
                        }
                        if (!account.name){
                            warn("Account name is required", form.findField("name"));
                            return;
                        }


                      //Create or update sourceAccount
                        if (!sourceAccount){
                            sourceAccount = {
                                vendorID: account.vendor
                            };
                        }
                        sourceAccount.accountName = account.name;
                        sourceAccount.accountNumber = account.number;
                        sourceAccount.active = account.avtive;



                      //Save Account
                        waitmask.show();
                        post("SourceAccount", JSON.stringify(sourceAccount), {
                            success: function(){
                                grid.onSelectionChange(); //force reload
                                waitmask.hide();
                            },
                            failure: function(request){
                                waitmask.hide();
                                alert(request);
                            }
                        });

                    }
                }
            ]
        });

        var reset = function(){
            form.reset();
            if (sourceAccount){
                editor.setTitle("Edit Account");
                form.setValue("name", sourceAccount.accountName);
                form.setValue("number", sourceAccount.accountNumber);
                form.setValue("description", sourceAccount.description);
                form.setValue("active", sourceAccount.active);
                form.disableField("vendor");
                for (var i=0; i<vendors.length; i++){
                    var vendor = vendors.get(i);
                    if (vendor.id===sourceAccount.vendorID){
                        form.setValue("vendor", vendor.name);
                        break;
                    }
                }
            }
            else{
                editor.setTitle("New Account");
                form.setValue("active", true);
                for (var i=0; i<vendors.length; i++){
                    var vendor = vendors.get(i);
                    vendorField.add(vendor.name, vendor.id);
                }
            }
        };
        reset();
    };


  //**************************************************************************
  //** editTemplate
  //**************************************************************************
    var editTemplate = function(sourceTemplate){
        editor.clear();
        console.log(sourceTemplate);
    };


  //**************************************************************************
  //** editVendor
  //**************************************************************************
    var editVendor = function(vendor){
        editor.clear();
        var orgVendor = vendor;


        var form = new javaxt.dhtml.Form(editor.getBody(), {
            style: config.style.form,
            items: [
                {
                    name: "name",
                    label: "Name",
                    type: "text"
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea"
                },
                {
                    name: "active",
                    label: "Active",
                    type: "radio",
                    alignment: "vertical",
                    options: [
                        {
                            label: "True",
                            value: true
                        },
                        {
                            label: "False",
                            value: false
                        }
                    ]
                }
            ],
            buttons: [
                {
                    name: "Reset",
                    onclick: function(){
                        reset();
                    }
                },
                {
                    name: "Save",
                    onclick: function(){

                        var vendor = form.getData();
                        if (!vendor.name){
                            warn("Name is required", form.findField("name"));
                            return;
                        }

                        vendor.id = orgVendor.id;


                      //Save Vendor
                        waitmask.show();
                        post("Vendor", JSON.stringify(vendor), {
                            success: function(id){

                              //Get updated model
                                get("Vendor?id="+id, {
                                    success: function(text){
                                        vendor = JSON.parse(text);
                                        if (orgVendor){
                                            for (var i=0; i<vendors.length; i++){
                                                if (vendors.get(i)===orgVendor){
                                                    vendors.set(i, JSON.parse(text));
                                                    break;
                                                }
                                            }
                                        }
                                        else{
                                            vendors.add(vendor);
                                        }
                                        grid.onSelectionChange(); //force reload
                                        waitmask.hide();
                                    },
                                    failure: function(request){
                                        waitmask.hide();
                                        alert(request);
                                    }
                                });

                            },
                            failure: function(request){
                                waitmask.hide();
                                alert(request);
                            }
                        });


                    }
                }
            ]
        });


        var reset = function(){
            form.reset();
            if (vendor){
                editor.setTitle("Edit Vendor");
                form.setValue("name", vendor.name);
                form.setValue("description", vendor.description);
                form.setValue("active", vendor.active);
            }
            else{
                editor.setTitle("New Vendor");
                form.setValue("active", true);
            }
        };
        reset();
    };



  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var del = javaxt.dhtml.utils.del;
    var post = javaxt.dhtml.utils.post;
    var merge = javaxt.dhtml.utils.merge;
    var setStyle = javaxt.dhtml.utils.setStyle;
    var createTable = javaxt.dhtml.utils.createTable;

    var warn = javaxt.express.finance.utils.warn;
    var createSpacer = javaxt.express.finance.utils.createSpacer;
    var createButton = javaxt.express.finance.utils.createButton;
    var createWaitMask = javaxt.express.finance.utils.createWaitMask;
    var normalizeResponse = javaxt.express.finance.utils.normalizeResponse;
    var getDataStore = javaxt.express.finance.utils.getDataStore;



    init();
};