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
        style: javaxt.express.finance.style,
        defaultColor: "#6b6b6b"
    };
    defaultConfig.style.border = "1px solid #ccc";
    defaultConfig.style.form.padding = "15px 20px 0 15px";

    var isMobile = false;

    var waitmask;
    var addButton, editButton, deleteButton; //Buttons
    var grid, grid2; //DataGrids
    var editor;
    var vendors; //DataStore
    var colorPicker;


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


      //Get or create animation effects
        if (!config.fx) config.fx = new javaxt.dhtml.Effects();



      //Create main div
        var div = createElement("div", parent, {
            position: "relative",
            height: "100%"
        });
        me.el = div;


      //Create waitmask
        waitmask = createWaitMask(div);


      //Create main table
        var table = createTable(div);
        var td;


      //Row 1
        td = table.addRow().addColumn("panel-toolbar");
        td.style.width = "100%";
        createToolbar(td);


      //Row 2
        td = table.addRow().addColumn({
            width: "100%",
            height: "100%"
        });
        createPanels(td);





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
        var toolbar = createElement('div', parent);


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

    };


  //**************************************************************************
  //** createPanels
  //**************************************************************************
    var createPanels = function(parent){
        var table = createTable(parent);
        var tr = table.addRow();
        var td;


        var style = merge({
            headerColumn : "table-header-col no-border"
        }, config.style.table);


      //Left column
        td = tr.addColumn();
        grid = new javaxt.dhtml.DataGrid(td, {
            style: style,
            columns: [
                {header: 'Category', width:'100%'}
            ]
        });
        grid.load([['Accounts'],['Vendors'],['Sources'],['Templates']]);

        grid.getSelectedRecord = function(){
            var arr = grid.getSelectedRecords();
            if (arr.length>0){
                return arr[0][0];
            }
            return null;
        };

        grid.onSelectionChange = function(){

            editor.clear();

            addButton.enable();
            editButton.disable();
            deleteButton.disable();


          //Update grid
            var selectedRecord = grid.getSelectedRecord();
            if (selectedRecord){
                if (selectedRecord==="Vendors"){
                    grid2.load(vendors);
                }
                else{

                    var url;
                    if (selectedRecord=="Sources"){
                        url = "SourceAccounts?orderby=accountName";
                    }
                    else if (selectedRecord=="Templates"){
                        url = "SourceTemplates?orderby=name";
                    }
                    else{
                        url = selectedRecord + "?orderby=name";
                    }

                    get(url,{
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


      //Center column
        td = tr.addColumn({
            borderLeft: config.style.border,
            borderRight: config.style.border
        });
        grid2 = new javaxt.dhtml.DataGrid(td, {
            style: style,
            columns: [
                {header: 'Name', width:'100%'}
            ],
            update: function(row, data){

                var selectedRecord = grid.getSelectedRecord();


              //Find name attribute in the data
                var name;
                for (var key in data) {
                    if (data.hasOwnProperty(key)){
                        if (key.toLowerCase().indexOf("name")>-1){ //remove "s"
                            name = data[key];
                            break;
                        }
                    }
                }




              //Find vendor name
                var vendorName, vendorColor;
                if (data.vendorID){
                    for (var i=0; i<vendors.length; i++){
                        var vendor = vendors.get(i);
                        if (vendor.id===data.vendorID){
                            vendorName = vendor.name;
                            if (vendor.info) vendorColor = vendor.info.color;
                            break;
                        }
                    }
                }



                var div = createElement("div", {
                    position: "relative"
                });



                if (selectedRecord==="Vendors"){

                    var color;
                    if (data.info) color = data.info.color;
                    if (!color) color = config.defaultColor;

                    var colorScale = chroma.scale([color, "#fff"]);

                    var backgroundColor = colorScale(0.5).css();
                    var borderColor = color;


                    createElement("div", div, {
                        display: "inline-block",
                        float: "left",
                        backgroundColor: backgroundColor,
                        borderColor: borderColor
                    }).className = "source-manager-account-icon";

                }
                else if (selectedRecord==="Sources"){

                    var cell = createCell("source", {
                        color: vendorColor,
                        vendor: vendorName,
                        account: name
                    });

                    row.set(0, cell);
                    if (true) return;
                }



                if (vendorName) name += " (" + vendorName + ")";
                createElement("div", div, {
                    float: "left",
                    display: "inline-block"
                }).innerHTML = name;



                row.set(0, div);

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


      //Right column
        td = tr.addColumn({
            width: "34%"
        });
        createEditor(td);
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
        else if (model=="Sources"){
            editSource(data);
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
        var table = createTable(parent);
        var tr, td;


        tr = table.addRow("table-header");
        td = tr.addColumn("table-header-col no-border noselect");
        td.innerHTML = "Editor";
        var header = td;


        td = table.addRow().addColumn({
            height: "100%",
            verticalAlign: "top"
        });
        var body = createElement("div", td);
        setStyle(body, config.style.form);



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
    var editAccount = function(account){
        editor.clear();
        var orgAccount = account;


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
                    name: "logo",
                    label: "Logo",
                    type: createUploadPanel()
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

                        var account = form.getData();
                        if (!account.name){
                            form.showError("Name is required", "name");
                            return;
                        }


                        account.id = orgAccount ? orgAccount.id : null;
                        account.info = orgAccount ? orgAccount.info : {};
                        if (!account.info) account.info = {};
                        account.info.color = getColor(account.color);
                        delete account.color;
                        if (account.logo) account.info.logo = account.logo;
                        delete account.logo;



                      //Save Account
                        waitmask.show();
                        post("Account", JSON.stringify(account), {
                            success: function(){
                                editor.clear();
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
            if (account){
                editor.setTitle("Edit Account");
                form.setValue("name", account.name);
                form.setValue("description", account.description);
                form.setValue("active", account.active);
                if (account.info){
                    form.setValue("logo", account.info.logo);
                }
            }
            else{
                editor.setTitle("New Account");
                form.setValue("active", true);
            }
        };
        reset();
    };


  //**************************************************************************
  //** editSource
  //**************************************************************************
    var editSource = function(sourceAccount){
        editor.clear();

        var vendorField;
        if (sourceAccount){
            vendorField = "text";
        }
        else{
            var div = createElement("div");
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
                    label: "Vendor",
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
                        sourceAccount.active = account.active;


                        if (!sourceAccount.info) sourceAccount.info = {};
                        sourceAccount.info.color = getColor(account.color);



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
                    name: "color",
                    label: "Color",
                    type: new javaxt.dhtml.ComboBox(
                        createElement("div"),{
                            style: config.style.combobox
                        }
                    )
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
                        vendor.info = orgVendor.info;
                        if (!vendor.info) vendor.info = {};
                        vendor.info.color = getColor(vendor.color);
                        delete vendor.color;



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


      //Update color field
        addColorPicker("color", form);


        var reset = function(){
            form.reset();
            if (vendor){
                editor.setTitle("Edit Vendor");
                form.setValue("name", vendor.name);
                form.setValue("description", vendor.description);
                form.setValue("active", vendor.active);

                var color;
                if (vendor.info) color = vendor.info.color;
                if (!color) color = config.defaultColor;
                form.setValue("color", color);
            }
            else{
                editor.setTitle("New Vendor");
                form.setValue("active", true);
                form.setValue("color", config.defaultColor);
            }
        };
        reset();
    };


  //**************************************************************************
  //** addColorPicker
  //**************************************************************************
    var addColorPicker = function(fieldName, form){
        var colorField = form.findField(fieldName);
        var colorPreview = colorField.getButton();
        colorPreview.className = colorPreview.className.replace("pulldown-button-icon", "");
        colorPreview.style.boxShadow = "none";
        colorPreview.setColor = function(color){
            colorPreview.style.backgroundColor =
            colorPreview.style.borderColor = color;
        };
        colorField.setValue = function(color){
            color = getColor(color);
            colorPreview.setColor(color);
            colorField.getInput().value = color;
            form.onChange(colorField, color);
        };
        colorField.getValue = function(){
            return colorField.getInput().value;
        };
        colorPreview.onclick = function(){
            if (!colorPicker) colorPicker = createColorPicker();
            var rect = javaxt.dhtml.utils.getRect(colorField.getInput());
            var x = rect.x - 15;
            var y = rect.y + (rect.height/2);
            colorPicker.showAt(x, y, "left", "middle");
            colorPicker.setColor(colorField.getValue());
            colorPicker.onChange = function(color){
                colorField.setValue(color);
            };
        };
    };


  //**************************************************************************
  //** createColorPicker
  //**************************************************************************
  /** Used to create a callout with a colorpicker.
   */
    var createColorPicker = function(){

      //Create popup
        var body = document.body;
        var popup = new javaxt.dhtml.Callout(body,{
            style: config.style.callout
        });
        var innerDiv = popup.getInnerDiv();


      //Create title div
        var title = "Select Color";
        var titleDiv = createElement("div", innerDiv, "window-header");
        titleDiv.innerHTML = "<div class=\"window-title\">" + title + "</div>";



      //Create content div
        var contentDiv = createElement("div", innerDiv, {
            padding: "15px",
            fontSize: "12px"
        });




        var cp = new iro.ColorPicker(contentDiv, {
          width: 320,
          height: 320,
          anticlockwise: true,
          borderWidth: 1,
          borderColor: "#fff",
          css: {
            "#output": {
              "background-color": "$color"
            }
          }
        });


        cp.on("color:change", function(c){
            popup.onChange(c.hexString);
        });


        popup.setColor = function(color){
            cp.color.set(getColor(color));
        };

        popup.onChange = function(hexColor){};


        return popup;
    };



  //**************************************************************************
  //** getColor
  //**************************************************************************
  /** Returns a hex color value for a given color
   *  @param color Accepts html standard colors. Example: 'red', '#ff0000',
   *  and 'rgb(255, 0, 0)'
   */
    var getColor = function(color){

      //Get rgba color
        var canvas = createElement('canvas');
        canvas.height = 1;
        canvas.width = 1;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        var rgba = ctx.getImageData(0, 0, 1, 1).data;


      //Convert to hex
        var hex = [0,1,2].map(
            function(idx) {
                var num = rgba[idx];
                return ('0'+num.toString(16)).slice(-2);
            }
        ).join('');
        return "#"+hex;
    };


  //**************************************************************************
  //** createUploadPanel
  //**************************************************************************
    var createUploadPanel = function(){

      //Create div with enough height to match the preview panel
        var div = createElement("div", {
            width: "100%",
            height: "200px",
            textAlign: "center"
        });
        div.className = "form-input";



      //Create thumbnailEditor
        var thumbnailEditor = new javaxt.dhtml.ThumbnailEditor(div, {
            thumbnailWidth: 150,
            thumbnailHeight: 150,
            readOnly: true,
            sliders: false,
            mask: false,
            style: {
                backgroundColor: "#fff",
                uploadArea: "logo-upload-area"
            }
        });


      //Update vertical position of the thumbnailEditor
        thumbnailEditor.el.className = "middle";


      //Create form input
        var input = {
            el: div,
            getValue: function(){
                return thumbnailEditor.getImage("png", true);
            },
            setValue: function(src){
                thumbnailEditor.setImage(src);
            },
            onChange: function(){}
        };


      //Watch for changes to the thumbnailEditor and relay it to the form input
        thumbnailEditor.onChange = function(){
            input.onChange();
        };


      //Return form input
        return input;
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
    var createElement = javaxt.dhtml.utils.createElement;

    var warn = javaxt.express.finance.utils.warn;
    var createCell = javaxt.express.finance.utils.createCell;
    var createSpacer = javaxt.express.finance.utils.createSpacer;
    var createButton = javaxt.express.finance.utils.createButton;
    var createWaitMask = javaxt.express.finance.utils.createWaitMask;
    var normalizeResponse = javaxt.express.finance.utils.normalizeResponse;
    var getDataStore = javaxt.express.finance.utils.getDataStore;



    init();
};