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
    var orgConfig = config;
    var defaultConfig = {
        style: javaxt.express.finance.style,
        dateFormat: "M/d/yyyy",
        timezone: "America/New_York",
        editor: {
            numColumns: 2
        }
    };


    var transactionGrid, transactionEditor,
        accountGrid, accountEditor,
        categoryGrid, categoryEditor,
        facetPanel, accountsFacet, yearsFacet,
        importWizard, rules,
        notificationWindow;

    var isMobile = false;
    var vendors, sources, sourceAccounts, accounts, accountStats; //DataStores
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


      //Get or create animation effects
        if (!config.fx) config.fx = new javaxt.dhtml.Effects();


      //Update timezone
        config.timezone = config.timezone.trim().replace(" ", "_");


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


      //Create facet panel
        td = document.createElement("td");
        td.style.height = "100%";
        tr.appendChild(td);
        createFacetPanel(td);


      //Create main panel
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        td.style.backgroundColor = "#f8f8f8";
        tr.appendChild(td);
        createMainPanel(td);

        parent.appendChild(table);
        me.el = table;

      //Get or create DataStores for vendors, sources, and sourceAccounts
        getSources(orgConfig, function(){
            vendors = orgConfig.vendors;
            sources = orgConfig.sources;
            sourceAccounts = orgConfig.sourceAccounts;
        });


      //Get accounts and update the panels
        getAccounts(orgConfig, function(){
            accounts = orgConfig.accounts;

            accounts.addEventListener("add", function(account){
                if (accountStats) accountStats.add({name: account.name, count: 0});
            }, me);

            accounts.addEventListener("remove", function(account){
                if (accountStats){

                    var idx, currCount, na;
                    for (var i=0; i<accountStats.length; i++){
                        var record = accountStats.get(i);
                        if (record.name===account.name){
                            idx = i;
                            currCount = record.count;
                        }
                        if (record.name==="N/A"){
                            na = i;
                        }
                    }

                    accountStats.removeAt(idx);
                    var record = accountStats.get(na);
                    record.count += currCount;
                    accountStats.set(na, record);
                }
            }, me);

            accounts.addEventListener("update", function(account, orgAccount){
                if (account.name!==orgAccount.name && accountStats){
                    for (var i=0; i<accountStats.length; i++){
                        var record = accountStats.get(i);
                        if (record.name===orgAccount.name){
                            record.name = account.name;
                            accountStats.set(i, record);
                            break;
                        }
                    }
                }
            }, me);


            accountGrid.update();
            transactionGrid.load();
        });


      //Get years (lazy - not using data store)
        get("report/TransactionsPerYear", {
            success: function(text){
                var data = JSON.parse(text);
                yearsFacet.update(data);
            }
        });


      //Get stats and update the facet panel
        updateAccountStats();
    };


  //**************************************************************************
  //** updateAccountStats
  //**************************************************************************
    var updateAccountStats = function(refresh){
        if (refresh===true) delete orgConfig.stats.accounts;
        getTransactionsPerAccount(orgConfig, function(){
            accountStats = orgConfig.stats.accounts;

            var updateFacet = function(){
                var data = {};
                for (var i=0; i<accountStats.length; i++){
                    var record = accountStats.get(i);
                    data[record.name] = record.count;
                }
                accountsFacet.update(data);
            };
            updateFacet();

            var events = ["add", "remove", "update"];
            for (var i=0; i<events.length; i++){
                accountStats.addEventListener(events[i], function(){
                    updateFacet();
                }, me);
            }

        });
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
            icon: "newIcon",
            hidden: isMobile
        });
        addButton.onClick = function(){

        };


      //Edit button
        var editButton = createButton(toolbar, {
            label: "Edit",
            icon: "editIcon",
            toggle: true,
            disabled: true
        });



      //Delete button
        var deleteButton = createButton(toolbar, {
            label: "Delete",
            icon: "deleteIcon",
            disabled: true
        });
        deleteButton.onClick = function(){

        };


        createSpacer(toolbar);


      //Categorize button
        var categorizeButton = createButton(toolbar, {
            label: "Categorize",
            icon: "mergeIcon",
            toggle: true,
            disabled: false
        });
        categorizeButton.onClick = function(){
            if (this.isSelected()){
                transactionEditor.show();
            }
            else{
                transactionEditor.hide();
            }
        };


      //Filter button
        var filterButton = createButton(toolbar, {
            label: "Filter",
            icon: "filterIcon",
            toggle: true
        });
        filterButton.onClick = function(){
            if (this.isSelected()){
                facetPanel.show();
            }
            else{
                facetPanel.hide();
            }
        };


        createSpacer(toolbar);


      //Add "Rules" menu button
        var rulesButton = createButton(toolbar, {
            label: "Rules",
            disabled: false,
            menu: true
        });
        var rulesMenu = rulesButton.getMenuPanel();

        var runButton = createButton(rulesMenu, {
            label: "Run...",
            icon: "runIcon",
            display: "inherit",
            style: {
                button: "menu-button",
                hover:  "menu-button-hover"
            }
        });
        runButton.onClick = function(){
            runRules();
        };

        var viewButton = createButton(rulesMenu, {
            label: "Edit...",
            icon: "checklistIcon",
            display: "inherit",
            style: {
                button: "menu-button",
                hover:  "menu-button-hover"
            }
        });
        viewButton.onClick = function(){
            if (!rules) rules = new javaxt.express.finance.Rules(null, {
                vendors: vendors,
                sources: sources,
                accounts: accounts,
                sourceAccounts: sourceAccounts
            });
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
            updateAccountStats(true);
        };


        parent.appendChild(toolbar);
    };


  //**************************************************************************
  //** createTransactionGrid
  //**************************************************************************
    var createTransactionGrid = function(parent){

        filter.orderby = "date desc, id";
        //filter.categoryID = "null";

        transactionGrid = new javaxt.dhtml.DataGrid(parent, {
            style: config.style.table,
            url: "transactions",
            fields: "id,date,description,amount,categoryID",
            filter: filter,
            parseResponse: parseResponse,
            columns: [
                {header: 'Date', field: 'date', width:'90', align: 'right'},
                {header: 'Day', width:'90', align: 'left'},
                {header: 'Source', field: 'sourceID', width:'120'},
                {header: 'Description', field: 'description', width:'100%'},
                {header: 'Account', width:'120'},
                {header: 'Category', width:'120'},
                {header: 'Amount', field: 'amount', width:'105', align: 'right'}
            ],
            update: function(row, transaction){

                var m = moment.tz(transaction.date, config.timezone);
                row.set('Date', createCell("date", m, config.dateFormat));
                row.set('Day', m.format('dddd'));
                row.set('Description', transaction.description);
                row.set('Amount', createCell("currency", transaction.amount));

                var category = findCategory(transaction.categoryID);
                if (category){
                    row.set("Category", category.name);
                    row.set("Account", category.account.name);
                }

                var source = findSource(transaction.sourceID);
                row.set('Source', createCell("source", source));
            }
        });


        transactionGrid.onSelectionChange = function(){
            //accountGrid.deselectAll();
            categoryGrid.deselectAll();
        };

    };


  //**************************************************************************
  //** findCategory
  //**************************************************************************
    var findCategory = function(categoryID){
        if (!isNumber(categoryID)) return null;
        for (var i=0; i<accounts.length; i++){
            var account = accounts.get(i);
            var categories = account.categories;
            if (categories){
                for (var j=0; j<categories.length; j++){
                    var category = categories.get(j);
                    if (category.id===categoryID){
                        return {
                            account: account,
                            name: category.name
                        };
                    }
                }
            }
        }
        return null;
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
        config.fx.setTransition(div, "easeInOutCubic", 600);
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
                {header: 'Accounts', field: 'name', width:'100%'}
            ],
            update: function(row, account){
                row.set(0, account.name);
            }
        });


        accountGrid.onLoad = function(){
            panel.createButton.enable();
        };


        accountGrid.onSelectionChange = function(){
            currSelection = null;
            var arr = accountGrid.getSelectedRecords();
            if (arr.length>0) currSelection = arr[0];


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
                rows.push(accounts.get(i));
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
        panel.table.className = "green-table";

        panel.toolbar.className = "bbar bbar-green";
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
            headerRow: "green-table-header",
            headerColumn : "green-table-header-col",
            row: "green-table-row",
            selectedRow: "green-table-row-selected"
        }, config.style.table);


        categoryGrid = new javaxt.dhtml.DataGrid(panel.body, {
            style: style,
            columns: [
                {header: 'Categories', width:'100%'}
            ],
            update: function(row, account){
                row.set(0, account.name);
            }
        });


        categoryGrid.onSelectionChange = function(){
            currSelection = null;
            var arr = categoryGrid.getSelectedRecords();
            if (arr.length>0){
                var category = arr[0];
                currSelection = category;

              //Find account
                var categoryID = category.id;
                var account;
                for (var i=0; i<accounts.length; i++){
                    var categories = accounts.get(i).categories;
                    if (categories){
                        for (var j=0; j<categories.length; j++){
                            if (categories.get(j).id===categoryID){
                                account = accounts.get(i);
                                break;
                            }
                        }
                    }
                }

              //Link transaction
                var arr = transactionGrid.getSelectedRecords();
                if (arr.length>0) linkTransaction(arr[0], category, account);
            }


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
                        rows.push(categories.get(i));
                    }
                    categoryGrid.load(rows);
                }

                var arr = accountGrid.getSelectedRecords();
                if (arr.length>0) {
                    var accountID = arr[0].id;
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
    var linkTransaction = function(transaction, category, account){
        if (transaction.categoryID===category.id) return;
        get("linkTransaction/" + transaction.id + "?categoryID="+ category.id,  {
            success: function(){

              //Update grid
                transactionGrid.forEachRow(function (row) {
                    var id = row.record.id;
                    if (id===transaction.id){
                        row.set("Account", account.name);
                        row.set("Category", category.name);
                        row.record.categoryID = category.id;
                        return true;
                    }
                });


              //Update account stats
                for (var i=0; i<accountStats.length; i++){
                    var record = accountStats.get(i);
                    if (record.name===account.name){
                        record.count += 1;
                        accountStats.set(i, record);
                    }
                    if (record.name==="N/A"){
                        record.count -= 1;
                        accountStats.set(i, record);
                    }
                }
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
                account = accountEditor.getValues();
                var isNew = !isNumber(account.id);
                save("account", JSON.stringify(account), {
                    success: function(id){
                        accountEditor.close();
                        get("account/" + id, {
                            success: function(text){
                                var account = JSON.parse(text);

                              //Update accounts array
                                var addAccount = true;
                                for (var i=0; i<accounts.length; i++){
                                    if (accounts.get(i).id===account.id){
                                        account.categories = accounts.get(i).categories;
                                        accounts.set(i, account);
                                        addAccount = false;
                                        break;
                                    }
                                }
                                if (addAccount) accounts.push(account);



                              //Update account grid
                                accountGrid.update();
                                accountGrid.select(account);


                              //Update transaction grid
                                if (isNew) transactionGrid.deselectAll();
                                if (account.categories){
                                    transactionGrid.forEachRow(function (row) {
                                        var categoryID = row.record.categoryID;
                                        if (categoryID){
                                            for (var i=0; i<account.categories.length; i++){
                                                if (account.categories.get(i).id===categoryID){
                                                    row.set("Account", account.name);
                                                    row.update();
                                                    break;
                                                }
                                            }
                                        }
                                    });
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

              //Update accounts array
                var categoryIDs = [];
                for (var i=0; i<accounts.length; i++){
                    if (accounts.get(i).id===account.id){
                        var categories = accounts.get(i).categories;
                        if (categories){
                            for (var j=0; j<categories.length; j++){
                                categoryIDs.push(categories.get(j).id);
                            }
                        }
                        accounts.splice(i, 1);
                        accountGrid.update();
                        categoryGrid.update();
                        break;
                    }
                }

              //Update transaction grid
                if (categoryIDs.length>0){
                    transactionGrid.forEachRow(function (row) {
                        var categoryID = row.record.categoryID;
                        if (categoryID){
                            for (var i=0; i<categoryIDs.length; i++){
                                if (categoryIDs[i]===categoryID){
                                    delete row.record.categoryID;
                                    row.set("Category", null);
                                    row.set("Account", null);
                                    row.update();
                                    break;
                                }
                            }
                        }
                    });
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

                              //Update accounts array
                                var accountID = category.account.id;
                                delete category.account;
                                var addCategory = true;
                                var account;
                                for (var i=0; i<accounts.length; i++){
                                    if (accounts.get(i).id===accountID){
                                        account = accounts.get(i);
                                        var categories = account.categories;
                                        if (categories){
                                            for (var j=0; j<categories.length; j++){
                                                if (categories.get(j).id===category.id){
                                                    categories.set(j, category);
                                                    addCategory = false;
                                                    break;
                                                }
                                            }
                                        }
                                        break;
                                    }
                                }
                                if (addCategory){
                                    if (!account.categories) account.categories = new javaxt.dhtml.DataStore();
                                    account.categories.push(category);
                                }


                              //Update category grid
                                categoryGrid.update(account);


                              //Update transaction grid
                                transactionGrid.forEachRow(function (row) {
                                    if (row.record.categoryID===category.id){
                                        row.set("Category", category.name);
                                        row.update();
                                    }
                                });
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
            var account = accountGrid.getSelectedRecords()[0];
            categoryEditor.setValue("accountID", account.id);
            categoryEditor.setValue("isExpense", true);
        }

        categoryEditor.show();
    };


  //**************************************************************************
  //** deleteCategory
  //**************************************************************************
    var deleteCategory = function(category){
        del("category/" + category.id, {
            success: function(){

              //Update accounts
                for (var i=0; i<accounts.length; i++){
                    if (accounts.get(i).categories){
                        var account;
                        var categories = accounts.get(i).categories;
                        for (var j=0; j<categories.length; j++){
                            if (categories.get(j).id===category.id){
                                account = accounts.get(i);
                                categories.splice(j, 1);
                                categoryGrid.update(account);
                                break;
                            }
                        }
                    }
                    if (account) break;
                }

              //Update transaction grid
                transactionGrid.forEachRow(function (row) {
                    if (row.record.categoryID===category.id){
                        delete row.record.categoryID;
                        row.set("Category", null);
                        row.update();
                    }
                });


              //Update account stats
                updateAccountStats(true);
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** runRules
  //**************************************************************************
    var runRules = function(){
        get("runRules",  {
            success: function(text){
                var arr = JSON.parse(text);
                var numUpdates = arr.length;
                if (numUpdates===0){
                    notify("Successfully ran rules. No transactions were updated.");
                }
                else{
                    transactionGrid.forEachRow(function (row) {
                        var transaction = row.record;
                        for (var i=0; i<arr.length; i++){
                            var transactionID = arr[i][0];
                            var categoryID = arr[i][1];
                            if (transactionID===transaction.id){
                                transaction.categoryID = categoryID;
                                var category = findCategory(categoryID);
                                if (category){
                                    row.set("Category", category.name);
                                    row.set("Account", category.account.name);
                                }
                                arr.splice(i, 1);
                                break;
                            }
                        }
                        if (arr.length===0) return true;
                    });
                    notify("Successfully updated " + numUpdates + " transactions.");
                    updateAccountStats(true);
                }
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** notify
  //**************************************************************************
    var notify = function(msg){
        if (!notificationWindow){
            var body = document.getElementsByTagName("body")[0];
            var contentDiv = document.createElement("div");
            var buttonDiv = document.createElement("div");
            buttonDiv.className = "button-div";
            notificationWindow = new javaxt.dhtml.Window(body, {
                width: 450,
                valign: "top",
                modal: false,
                body: contentDiv,
                footer: buttonDiv,
                style: config.style.window
            });

            var button = document.createElement("input");
            button.type = "button";
            button.name = button.value = "OK";
            button.className = "form-button";
            button.onclick = notificationWindow.hide;
            buttonDiv.appendChild(button);

            notificationWindow.setMessage = function(str){
                contentDiv.innerHTML = str;
            };
        }
        notificationWindow.setMessage(msg);
        notificationWindow.show();
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
        var width = 280;
        var horizontalPadding = 15;

      //Create panel
        var div = document.createElement("div");
        div.style.width = "0px";
        div.style.height = "100%";
        div.style.position = "relative";
        div.style.overflow = "hidden";
        div.style.borderRight = "1px solid #dcdcdc";
        config.fx.setTransition(div, "easeInOutCubic", 600);
        parent.appendChild(div);


      //Create overflow div
        var innerDiv = document.createElement("div");
        innerDiv.style.width = (width-(horizontalPadding*2)) + "px";
        innerDiv.style.height = "100%";
        innerDiv.style.position = "absolute";
        innerDiv.style.padding = "20px " + horizontalPadding + "px";
        div.appendChild(innerDiv);


      //Create accounts facet
        accountsFacet = new javaxt.express.Facet(innerDiv, {
            title: "Account",
            style: config.style.facet,
            sort: false
        });
        accountsFacet.onChange = function(val){
            if (val){
                var arr = val.split(",");
                if (arr.length===0 || arr.length===accountsFacet.getNumOptions()){
                    delete filter.categoryID;
                }
                else{
                    filter.categoryID = "";
                    var x = 0;
                    for (var i=0; i<arr.length; i++){
                        var accountName = arr[i];
                        if (accountName==="N/A"){
                            if (x>0) filter.categoryID+=",";
                            filter.categoryID+="null";
                            x++;
                        }
                        else{
                            for (var j=0; j<accounts.length; j++){
                                if (accounts.get(j).name===accountName){
                                    var categories = accounts.get(j).categories;
                                    if (categories){
                                        for (var k=0; k<categories.length; k++){
                                            if (x>0) filter.categoryID+=",";
                                            filter.categoryID+=categories.get(k).id;
                                            x++;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            else {
                delete filter.categoryID;
            }
            transactionGrid.refresh();
        };



      //Create accounts facet
        yearsFacet = new javaxt.express.Facet(innerDiv, {
            title: "Year",
            style: config.style.facet,
            sort: false
        });
        yearsFacet.onChange = function(val){
            if (val){
                var arr = val.split(",");
                if (arr.length===0 || arr.length===yearsFacet.getNumOptions()){
                    delete filter.year;
                }
                else{
                    filter["year(date)"] = val;
                }
            }
            else {
                delete filter.year;
            }
            transactionGrid.refresh();
        };



        facetPanel = div;
        facetPanel.show = function(){
            this.style.width = width + "px";
        };
        facetPanel.hide = function(){
            this.style.width = "0px";
        };
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
  //** findSource
  //**************************************************************************
    var findSource = function(sourceID){
        return javaxt.express.finance.utils.findSource(sourceID, vendors, sources, sourceAccounts);
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
    var createButton = javaxt.express.finance.utils.createButton;

    var isNumber = javaxt.express.finance.utils.isNumber;
    var parseResponse = javaxt.express.finance.utils.normalizeResponse;
    var getSources = javaxt.express.finance.utils.getSources;
    var getAccounts = javaxt.express.finance.utils.getAccounts;
    var getTransactionsPerAccount = javaxt.express.finance.utils.getTransactionsPerAccount;

    init();

};