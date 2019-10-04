if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  Transactions Panel
//******************************************************************************
/**
 *   Panel used to view and manage transactions
 *
 ******************************************************************************/

javaxt.express.finance.Transactions = function(parent, config) {

    var me = this;
    var defaultConfig = {
        style: javaxt.express.finance.style,
        editor: {
            numColumns: 2
        }
    };


    var transactionGrid, transactionEditor,
        accountGrid, accountEditor,
        categoryGrid, categoryEditor,
        importWizard, rules;

    var dateDisplayFormat;
    var fx = new javaxt.dhtml.Effects();
    var isMobile = false;
    var accounts = [];
    var filter = {};


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



      //Set date format
        dateDisplayFormat = getMomentFormat("M/d/yyyy");



      //Watch for drag and drop events
        parent.addEventListener('dragover', function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy'; //Explicitly show this is a copy
        }, false);
        parent.addEventListener('drop', function(e) {
            e.stopPropagation();
            e.preventDefault();

            var files = e.dataTransfer.files;
            for (var i=0; i<files.length; i++) {
                me.import(files[i]);
            }

        }, false);


      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td;

//        td = document.createElement("td");
//        td.style.width = "250px";
//        td.style.height = "100%";
//        tr.appendChild(td);
//        createFacetPanel(td);


        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);
        createMainPanel(td);

        parent.appendChild(table);
        me.el = table;
    };


  //**************************************************************************
  //** createMainPanel
  //**************************************************************************
    var createMainPanel = function(parent){

        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;

      //Row 1
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.colSpan = 2;
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
        createTransactionGrid(td);
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        createTransactionEditor(td);

        parent.appendChild(table);
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
            disabled: false,
            hidden: isMobile
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
            hidden: isMobile
        });
        refreshButton.onClick = function(){
            transactionGrid.refresh();
        };


        parent.appendChild(toolbar);
    };


  //**************************************************************************
  //** createTransactionGrid
  //**************************************************************************
    var createTransactionGrid = function(parent){

        filter.orderby = "date desc";

        transactionGrid = new javaxt.dhtml.DataGrid(parent, {
            style: config.style.table,
            url: "transactions",
            filter: filter,
            parseResponse: parseResponse,
            columns: [
              //Hidden fields
                {header: 'id', field: 'id', hidden:true},
                {header: 'categoryID', field: 'categoryID', hidden:true},

              //Visible fields
                {header: 'Date', field: 'date', width:'90', align: 'right'},
                {header: 'Day', width:'90', align: 'left'},
                {header: 'Description', field: 'description', width:'100%'},
                {header: 'Account', width:'120'},
                {header: 'Category', width:'120'},
                {header: 'Amount', field: 'amount', width:'90', align: 'right'}
            ],
            update: function(row, transaction){
                row.set('id', transaction.id);
                row.set('Amount', createCell("currency", transaction.amount));


                var m = moment(transaction.date);
                var date = m.format(dateDisplayFormat);
                row.set('Date', date);
                row.set('Day', m.format('dddd'));
                row.set('Description', transaction.description);


                var categoryID = transaction.categoryID;
                if (isNumber(categoryID)){
                    for (var i=0; i<accounts.length; i++){
                        var categories = accounts[i].categories;
                        if (categories){
                            for (var j=0; j<categories.length; j++){
                                if (categories[j].id===categoryID){
                                    row.set("Account", accounts[i].name);
                                    row.set("Category", categories[j].name);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        });




        transactionGrid.onSelectionChange = function(){
            //accountGrid.deselectAll();
            categoryGrid.deselectAll();
        };

    };



  //**************************************************************************
  //** createTransactionEditor
  //**************************************************************************
    var createTransactionEditor = function(parent){

      //Create panel
        var div = document.createElement("div");
        div.style.width = "0px";
        div.style.height = "100%";
        div.style.position = "relative";
        div.style.backgroundColor = "#fff";
        fx.setTransition(div, "easeInOutCubic", 600);
        parent.appendChild(div);


        var numColumns = config.editor.numColumns;
        var width = numColumns===2 ? 420 : 200;


        var innerDiv = document.createElement("div");
        innerDiv.style.width = width + "px";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        div.appendChild(innerDiv);


      //Add table with 2 rows
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;


      //Row 1
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);
        if (numColumns===2){
            var d = document.createElement("div");
            d.style.width = (width/2) + "px";
            d.style.height = "100%";
            td.appendChild(d);
            createAccountPanel(d, numColumns);
        }
        else{
            createAccountPanel(td);
        }


      //Row 2
        //tr = document.createElement("tr");
        //tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);
        if (numColumns===2){
            var d = document.createElement("div");
            d.style.width = (width/2) + "px";
            d.style.height = "100%";
            td.appendChild(d);
            createCategoryPanel(d, numColumns);
        }
        else{
            createCategoryPanel(td);
        }

        innerDiv.appendChild(table);



      //Add custom show/hide functions to the panel
        transactionEditor = div;
        transactionEditor.show = function(){
            this.style.width = width + "px";
        };
        transactionEditor.hide = function(){
            this.style.width = "0px";
        };


      //Get accounts and update the panels
        get("accounts", {
            success: function(text){
                accounts = parseResponse(text);
                get("categories", {
                    success: function(text){
                        var categories = parseResponse(text);
                        for (var i=0; i<categories.length; i++){
                            var category = categories[i];
                            for (var j=0; j<accounts.length; j++){
                                var account = accounts[j];
                                if (account.id===category.accountID){
                                    delete category.accountID;
                                    if (!account.categories) account.categories = [];
                                    account.categories.push(category);
                                    break;
                                }
                            }
                        }
                        accountGrid.update();
                        transactionGrid.load();
                    },
                    failure: function(request){
                        alert(request);
                    }
                });
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** createAccountPanel
  //**************************************************************************
    var createAccountPanel = function(parent, numColumns){
        var currSelection = null;

        var panel = createPanel(parent, numColumns===2);
        panel.table.className = "orange-table";

        panel.toolbar.className = "bbar bbar-orange";
        panel.createButton.onClick = function(){
            editAccount();
        };
        panel.editButton.onClick = function(){
            editAccount(currSelection);
        };
        panel.deleteButton.onClick = function(){
            deleteAccount(currSelection);
        };

        var style = merge({
            headerRow: "orange-table-header",
            headerColumn : "orange-table-header-col",
            row: "orange-table-row",
            selectedRow: "orange-table-row-selected"
        }, config.style.table);

        accountGrid = new javaxt.dhtml.DataGrid(panel.body, {
            style: style,
            url: "accounts",
            columns: [
                {header: 'id', field: 'id', hidden:true},
                {header: 'Accounts', field: 'name', width:'100%'}
            ]
        });


        accountGrid.onLoad = function(){
            panel.createButton.enable();
        };


        accountGrid.onSelectionChange = function(){
            currSelection = null;
            accountGrid.forEachRow(function (row, content) {
                if (row.selected){
                    var id = parseInt(content[0]);
                    for (var i=0; i<accounts.length; i++){
                        var account = accounts[i];
                        if (account.id===id){
                            currSelection = account;
                        }
                    }
                    return true;
                }
            });


            if (currSelection!=null){
                panel.editButton.enable();
                panel.deleteButton.enable();
            }
            else{
                panel.editButton.disable();
                panel.deleteButton.disable();
            }

            categoryGrid.update(currSelection);
        };


        accountGrid.update = function(){
            accountGrid.clear();
            var rows = [];
            for (var i=0; i<accounts.length; i++){
                var account = accounts[i];
                rows.push([account.id, account.name]);
            }
            accountGrid.load(rows);
        };


        accountGrid.select = function(account){
            console.log("TODO: Highlight/select account " + account.id);
            categoryGrid.update(account);
        };
    };


  //**************************************************************************
  //** createCategoryPanel
  //**************************************************************************
    var createCategoryPanel = function(parent, numColumns){
        var currSelection = null;

        var panel = createPanel(parent, numColumns===2);
        panel.table.className = "blue-table";

        panel.toolbar.className = "bbar bbar-blue";
        panel.createButton.onClick = function(){
            editCategory();
        };
        panel.editButton.onClick = function(){
            editCategory(currSelection);
        };
        panel.deleteButton.onClick = function(){
            deleteCategory(currSelection);
        };


        var style = merge({
            headerRow: "blue-table-header",
            headerColumn : "blue-table-header-col",
            row: "blue-table-row",
            selectedRow: "blue-table-row-selected"
        }, config.style.table);


        categoryGrid = new javaxt.dhtml.DataGrid(panel.body, {
            style: style,
            columns: [
                {header: 'id', hidden:true},
                {header: 'Categories', width:'100%'}
            ]
        });


        categoryGrid.onSelectionChange = function(){
            currSelection = null;

            categoryGrid.forEachRow(function (row, content) {
                if (row.selected){
                    var categoryID = parseInt(content[0]);
                    var account;
                    for (var i=0; i<accounts.length; i++){
                        var categories = accounts[i].categories;
                        if (categories){
                            for (var j=0; j<categories.length; j++){
                                if (categories[j].id===categoryID){
                                    currSelection = categories[j];
                                    account = accounts[i];
                                    break;
                                }
                            }
                        }
                    }


                    var arr = transactionGrid.getSelectedRecords();
                    if (arr.length>0) linkTransaction(parseInt(arr[0]), currSelection, account);

                    return true;
                }
            });


            if (currSelection!=null){
                panel.editButton.enable();
                panel.deleteButton.enable();
            }
            else{
                panel.editButton.disable();
                panel.deleteButton.disable();
            }

        };


        categoryGrid.update = function(account){
            categoryGrid.clear();
            panel.createButton.disable();

            if (account){
                var categories = account.categories;
                if (categories){
                    var rows = [];
                    for (var i=0; i<categories.length; i++){
                        var category = categories[i];
                        rows.push([category.id, category.name]);
                    }
                    categoryGrid.load(rows);
                }

                var arr = accountGrid.getSelectedRecords();
                if (arr.length>0) {
                    var accountID = parseInt(arr[0]);
                    if (accountID===account.id){
                        panel.createButton.enable();
                    }
                }
            }
        };

    };


  //**************************************************************************
  //** linkTransaction
  //**************************************************************************
    var linkTransaction = function(transactionID, category, account){
        get("linkTransaction/" + transactionID + "?categoryID="+ category.id,  {
            success: function(){

                transactionGrid.forEachRow(function (row, content) {
                    var id = parseInt(content[0]);
                    if (id===transactionID){
                        row.set("Account", account.name);
                        row.set("Category", category.name);
                        return true;
                    }
                });
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** editAccount
  //**************************************************************************
    var editAccount = function(account){
        if (!accountEditor){
            accountEditor = new javaxt.express.finance.AccountEditor();
            accountEditor.onSubmit = function(){
                var account = accountEditor.getValues();
                var isNew = !isNumber(account.id)
                save("account", JSON.stringify(account), {
                    success: function(id){
                        accountEditor.close();
                        get("account/" + id, {
                            success: function(text){
                                var account = JSON.parse(text);
                                var addAccount = true;
                                for (var i=0; i<accounts.length; i++){
                                    if (accounts[i].id===account.id){
                                        account.categories = accounts[i].categories;
                                        accounts[i] = account;
                                        addAccount = false;
                                        break;
                                    }
                                }
                                if (addAccount){
                                    accounts.push(account);
                                }
                                accountGrid.update();
                                accountGrid.select(account);
                                if (isNew){
                                    transactionGrid.deselectAll();
                                }
                            },
                            failure: function(request){
                                alert(request);
                            }
                        });

                    },
                    failure: function(request){
                        alert(request);
                    }
                });
            };
        }
        else{
            accountEditor.clear();
        }


        if (account){
            accountEditor.setTitle("Edit Account");
            for (var key in account) {
                if (account.hasOwnProperty(key)){
                    var value = account[key];
                    accountEditor.setValue(key, value);
                }
            }
        }
        else{
            accountEditor.setTitle("New Account");
            accountEditor.setValue("active", true);
        }

        accountEditor.show();
    };


  //**************************************************************************
  //** deleteAccount
  //**************************************************************************
    var deleteAccount = function(account){
        del("account/" + account.id, {
            success: function(){
                for (var i=0; i<accounts.length; i++){
                    if (accounts[i].id===account.id){
                        accounts.splice(i, 1);
                        accountGrid.update();
                        categoryGrid.update();
                        break;
                    }
                }
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** editCategory
  //**************************************************************************
    var editCategory = function(category){
        if (!categoryEditor){
            categoryEditor = new javaxt.express.finance.CategoryEditor();
            categoryEditor.onSubmit = function(){
                var category = categoryEditor.getValues();
                save("category", JSON.stringify(category), {
                    success: function(id){
                        categoryEditor.close();
                        get("category/" + id, {
                            success: function(text){
                                var category = JSON.parse(text);
                                var accountID = category.account.id;
                                delete category.account;
                                var addCategory = true;
                                var account;
                                for (var i=0; i<accounts.length; i++){
                                    if (accounts[i].id===accountID){
                                        account = accounts[i];
                                        var categories = accounts[i].categories;
                                        if (categories){
                                            for (var j=0; j<categories.length; j++){
                                                if (categories[j].id===category.id){
                                                    categories[j] = category;
                                                    addCategory = false;
                                                    break;
                                                }
                                            }
                                        }
                                        break;
                                    }
                                }
                                if (addCategory){
                                    if (!account.categories) account.categories = [];
                                    account.categories.push(category);
                                }
                                categoryGrid.update(account);
                                //categoryGrid.select(category);
                            },
                            failure: function(request){
                                alert(request);
                            }
                        });

                    },
                    failure: function(request){
                        alert(request);
                    }
                });
            };
        }
        else{
            categoryEditor.clear();
        }


        if (category){
            categoryEditor.setTitle("Edit Category");
            for (var key in category) {
                if (category.hasOwnProperty(key)){
                    var value = category[key];
                    categoryEditor.setValue(key, value);
                }
            }
        }
        else{
            categoryEditor.setTitle("New Category");
            accountGrid.forEachRow(function (row, content) {
                if (row.selected){
                    var id = parseInt(content[0]);
                    categoryEditor.setValue("accountID", id);
                    return true;
                }
            });
        }

        categoryEditor.show();
    };


  //**************************************************************************
  //** deleteCategory
  //**************************************************************************
    var deleteCategory = function(category){
        del("category/" + category.id, {
            success: function(){
                for (var i=0; i<accounts.length; i++){
                    if (accounts[i].categories){
                        var categories = accounts[i].categories;
                        for (var j=0; j<categories.length; j++){
                            if (categories[j]===category.id){
                                categories.splice(j, 1);
                                categoryGrid.update();
                                break;
                            }
                        }
                    }
                }
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** createPanel
  //**************************************************************************
    var createPanel = function(parent, centerAlign){

        var panel = {};
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;
        panel.table = table;
        parent.appendChild(table);


      //Row 1
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        panel.body = td;



      //Row 2
        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        tr.appendChild(td);
        panel.toolbar = td;

        var outerDiv = document.createElement("div");
        outerDiv.style.position = "relative";
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        td.appendChild(outerDiv);

        var innerDiv = document.createElement("div");
        if (centerAlign===true){
            outerDiv.style.textAlign = "center";
        }
        else{
            innerDiv.style.position = "absolute";
            innerDiv.style.right = 0;
            innerDiv.style.top = 0;
        }
        innerDiv.style.height = "100%";
        outerDiv.appendChild(innerDiv);



        var style = {
            button: "bbar-button",
            select: "bbar-button-selected",
            hover:  "bbar-button-hover",
            label: "bbar-button-label"
        };



        panel.createButton = new javaxt.dhtml.Button(innerDiv, {
            style: merge({
                icon: "bbar-button-icon-create"
            }, style),
            label: "",
            disabled: true
        });

        panel.editButton = new javaxt.dhtml.Button(innerDiv, {
            style: merge({
                icon: "bbar-button-icon-edit"
            }, style),
            label: "",
            disabled: true
        });

        panel.deleteButton = new javaxt.dhtml.Button(innerDiv, {
            style: merge({
                icon: "bbar-button-icon-delete"
            }, style),
            label: "",
            disabled: true
        });

        return panel;
    };




  //**************************************************************************
  //** createFacetPanel
  //**************************************************************************
    var createFacetPanel = function(parent){
        var div = document.createElement("div");
        div.style.width = "250px";
        div.style.height = "100%";
        div.style.padding = "20px 15px";
        div.style.borderRight = "1px solid #dcdcdc";

        var accountsFacet = new javaxt.express.Facet(div, {
            title: "Account",
            style: config.style.facet
        });

        parent.appendChild(div);
    };


  //**************************************************************************
  //** import
  //**************************************************************************
  /** Used to import data from a csv file
   */
    this.import = function(file){

        var fileName = file.name.toLowerCase();
        var ext = fileName.substring(fileName.lastIndexOf(".")+1);
        if (ext=='csv'){
            var reader = new FileReader();
            reader.onload = (function(f) {
                return function(e) {
                    var data = e.target.result;


                    if (!importWizard) importWizard = new javaxt.express.finance.ImportWizard();
                    importWizard.start(data);
                    importWizard.onEnd = function(source){


                        var payload = {
                            data: data,
                            source: source.id
                        };

                        save("transactions", JSON.stringify(payload), {
                            success: function(){
                                transactionGrid.refresh();
                            },
                            failure: function(request){
                                alert(request);
                            }
                        });


                    };

                };
            })(file);
            reader.readAsText(file);
        }
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
    var createCell = javaxt.express.finance.utils.createCell;
    var createSpacer = javaxt.express.finance.utils.createSpacer;

    var isNumber = javaxt.express.finance.utils.isNumber;
    var getMomentFormat = javaxt.express.finance.utils.getMomentFormat;

    var parseResponse = javaxt.express.finance.utils.normalizeResponse;


    init();

};