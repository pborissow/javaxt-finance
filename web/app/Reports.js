if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

javaxt.express.finance.Reports = function(parent, config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {
        style: javaxt.express.finance.style
    };
    var reportList, accountDetails, accountGraphics, transactionsPanel, menu;
    var timezone;
    var spacing = 30; //window spacing

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


      //Get timezone
        timezone = config.timezone;
        if (timezone==null || typeof timezone != 'string') timezone = "America/New_York";
        timezone = timezone.trim().replace(" ", "_");



      //Create main table
        var table = createTable();
        var tbody = table.firstChild;
        var tr = document.createElement("tr");
        tbody.appendChild(tr);
        var td;


        td = document.createElement("td");
        td.style.height = "100%";
        td.style.verticalAlign = "top";
        tr.appendChild(td);



      //Create container for reports
        reportList = document.createElement("div");
        reportList.style.height = "100%";
        td.appendChild(reportList);
        reportList.show = function(callback){
            config.fx.fadeIn(this, "easeInOutCubic", 600, callback);
        };
        reportList.hide = function(callback){
            config.fx.fadeOut(this, "easeInOutCubic", 600, callback);
        };



      //Create accountDetails
        accountDetails = createPanel(td, {
            onClose: function(){
                if (transactionsPanel) transactionsPanel.hide();
                if (accountGraphics) accountGraphics.hide();
                accountDetails.hide();
                reportList.show();
            },
            onSubTitle: function(div, e){
                var rect = javaxt.dhtml.utils.getRect(div);
                var x = rect.x + rect.width + 10;
                var y = rect.y + (rect.height/2);
                if (!menu) menu = createMenu();
                menu.showAt(x, y, "right", "middle");
            }
        });



      //Create accountGraphics
        accountGraphics = createPanel(td, {
            title: "Expense Summary",
            closable: false
        });
        var div = document.createElement("div");
        div.style.width = "425px";
        div.style.padding = "15px";
        var canvas = createCanvas(div);
        var chart = createDoughnut(canvas, {cutout: 60});
        accountGraphics.update(div);
        accountGraphics.update = function(expenses){

            var dataset = chart.data.datasets[0];
            dataset.data = [];


            for (var i=0; i<expenses.length; i++){
                var name = expenses[i].name;
                var val = expenses[i].total;
                if (val<0) dataset.data.push(-val);
            }


            dataset.backgroundColor = [];
            dataset.borderWidth = [];
            var colorIndex = 0;
            var colors = javaxt.express.finance.style.colors;
            for (var i=0; i<dataset.data.length; i++){
                var color = colors[colorIndex];
                colorIndex++;
                if (colorIndex===dataset.data.length) colorIndex=0;
                dataset.backgroundColor.push(color);
                dataset.borderWidth.push(0);
            }
            dataset.hoverBackgroundColor = dataset.backgroundColor;

            chart.update();
        };



      //Create transactionsPanel
        transactionsPanel = createPanel(td, {
            style: {
                body: {
                    padding: "0 0 5px 0",
                    verticalAlign: "top"
                }
            }
        });
        var div = document.createElement("div");
        div.style.width = "600px";
        div.style.height = "600px";

        var style = {
            row: "report-row",
            selectedRow: "report-row-selected",
            column: "report-cell"
        };
        merge(style, config.style.table);

        var transactionsTable = new javaxt.dhtml.Table(div, {
            style: style,
            columns: [
                {
                    header: "ID",
                    hidden: true
                },
                {
                    header: "Date",
                    width: 85,
                    align: "right"
                },
                {
                    header: "Desciption",
                    width: "100%"
                },
                {
                    header: "Amount",
                    width: 125,
                    align: "right"
                }
            ]
        });
        transactionsTable.onSelectionChange = function(rows){
            for (var i=0; i<rows.length; i++){
                var row = rows[i];
                if (row.selected){
                    var transactionID = parseInt(row.get(0));
                    console.log("Edit transaction " + transactionID);
                    break;
                }
            }
        };
        transactionsPanel.update(div);
        transactionsPanel.clear = function(){
            transactionsTable.clear();
        };
        transactionsPanel.update = function(arr){
            transactionsTable.addRows(arr);
        };


      //Get accounts and create reports
        getAccounts(orgConfig, function(){
            var accounts = orgConfig.accounts;
            for (var i=0; i<accounts.length; i++){
                var account = accounts.get(i);
                addReport(account);
            }

            accounts.addEventListener("add", function(account){
                addReport(account);
            }, me);

            accounts.addEventListener("remove", function(account){
                var div = getReport(account);
                if (div) reportList.removeChild(div);
            }, me);

            accounts.addEventListener("update", function(account){
                var div = getReport(account);
                if (div){
                    div.innerHTML = account.name + " Account";
                }
            }, me);
        });


        parent.appendChild(table);
        me.el = table;
    };


  //**************************************************************************
  //** getReport
  //**************************************************************************
    var getReport = function(account){
        for (var i=0; i<reportList.childNodes.length; i++){
            var div = reportList.childNodes[i];
            if (div.accountID===account.id){
                return div;
            }
        }
        return div;
    };


  //**************************************************************************
  //** addReport
  //**************************************************************************
    var addReport = function(account){
        var div = document.createElement("div");
        div.className = "report-preview";
        div.innerHTML = account.name + " Account";
        div.account = account;
        div.onclick = function(){
            var account = this.account;
            reportList.hide(function(){
                get("report/DistinctYears?accountID=" + account.id, {
                    success: function(text){
                        var arr = JSON.parse(text);
                        var year = new Date().getFullYear();
                        if (arr.length>0) year = arr[0];

                        accountDetails.years = arr;
                        getAccountSummary(account, year);
                    }
                });
            });
        };
        reportList.appendChild(div);
    };


  //**************************************************************************
  //** getAccountSummary
  //**************************************************************************
  /** Used to render income and expenses for a given account
   */
    var getAccountSummary = function(account, year, type){

        accountDetails.account = account;
        accountDetails.year = year;
        accountDetails.type = type;

        var comparePreviousYear = (type==="prevYear");


        var startDate = moment.tz(year + "-01-01 00:00", timezone).toISOString();
        var endDate = moment.tz((year+1) + "-01-01 00:00", timezone).toISOString();
        get("report/AccountSummary?accountID=" + account.id +
            "&startDate=" + startDate + "&endDate=" + endDate,  {
            success: function(text){
                var json = JSON.parse(text);
                var income = json.income;
                var expenses = json.expenses;


                accountDetails.clear();
                accountDetails.setTitle(account.name + " Account");
                accountDetails.setSubTitle( (comparePreviousYear?((year-1)+"-") : "") + year);


                var table = createTable();
                table.style.height = "";
                var tbody = table.firstChild;
                var tr, td;
                var rows = [];


                tr = document.createElement("tr");
                tr.style.height = "1px";
                tbody.appendChild(tr);
                var numColumns = 3;
                for (var i=0; i<numColumns; i++){
                    td = document.createElement("td");
                    td.style.width = "125px";
                    tr.appendChild(td);
                }
                tr.childNodes[0].style.width = "100%";


                var addHeader = function(title, col1, col2){
                    tr = document.createElement("tr");
                    tbody.appendChild(tr);
                    td = document.createElement("td");
                    td.className = "report-section-header";
                    //if (!addColHeader) td.colSpan = numColumns;
                    td.innerHTML = title;
                    tr.appendChild(td);


                    td = document.createElement("td");
                    td.className = "report-section-header report-column-header";
                    if (col1) td.innerHTML = col1;
                    tr.appendChild(td);

                    td = document.createElement("td");
                    td.className = "report-section-header report-column-header";
                    if (col2) td.innerHTML = col2;
                    tr.appendChild(td);

                };

                var addRow = function(category){
                    var isFooter = false;
                    if (!category.name) isFooter = true;
                    tr = document.createElement("tr");
                    tr.className = "report-row" + (isFooter? "-footer" : "");
                    tr.category = category;
                    tr.onclick = function(){
                        for (var i=0; i<rows.length; i++){
                            var idx = rows[i].className.indexOf(" report-row-selected");
                            if (idx>0) rows[i].className = rows[i].className.substring(0, idx);
                        }
                        this.className += " report-row-selected";
                        getTransactions(this.category, year);
                    };
                    tbody.appendChild(tr);

                    var cls = "report-cell" + (isFooter? "-footer" : "");
                    td = document.createElement("td");
                    td.className = cls;
                    if (!isFooter) td.innerHTML = category.name;
                    tr.appendChild(td);

                    td = document.createElement("td");
                    td.className = cls;
                    td.style.textAlign = "right";
                    td.innerHTML = formatCurrency(comparePreviousYear ? category.prevYear : category.total/12);
                    tr.appendChild(td);

                    td = document.createElement("td");
                    td.className = cls;
                    td.style.textAlign = "right";
                    td.innerHTML = formatCurrency(category.total);
                    tr.appendChild(td);
                    rows.push(tr);
                };


                var updatePanels = function(){
                    accountDetails.update(table);
                    accountDetails.showAt(spacing, spacing);

                    accountGraphics.update(expenses);
                    accountGraphics.showAt(accountDetails.getWidth()+(spacing*2), spacing);
                };


                if (comparePreviousYear){

                    startDate = moment.tz((year-1) + "-01-01 00:00", timezone).toISOString();

                    var currDate = moment().tz(timezone);
                    var currYear = parseInt(currDate.format("YYYY"));
                    if (year===currYear){
                        currDate = currDate.add(1, 'day');
                        endDate = moment.tz(currDate.format("YYYY-MM-DD") + " 00:00", timezone).toISOString();
                    }
                    else{
                        endDate = moment.tz(year + "-01-01 00:00", timezone).toISOString();
                    }


                  //Get data from the previous year
                    get("report/AccountSummary?accountID=" + account.id +
                        "&startDate=" + startDate + "&endDate=" + endDate,  {
                        success: function(text){
                            var json = JSON.parse(text);



                          //Update income records
                            for (var i=0; i<income.length; i++){income[i].prevYear=0;}
                            var income2 = json.income;
                            for (var i=0; i<income2.length; i++){
                                var addRecord = true;
                                for (var j=0; j<income.length; j++){
                                    if (income[j].name===income2[i].name){
                                        addRecord = false;
                                        income[j].prevYear = income2[i].total;
                                        break;
                                    }
                                }
                                if (addRecord){
                                    income.push({
                                        name: income2[i].name,
                                        total: 0,
                                        prevYear: income2[i].total
                                    });
                                }
                            }


                          //Update expense records
                            for (var i=0; i<expenses.length; i++){expenses[i].prevYear=0;}
                            var expenses2 = json.expenses;
                            for (var i=0; i<expenses2.length; i++){
                                var addRecord = true;
                                for (var j=0; j<expenses.length; j++){
                                    if (expenses[j].name===expenses2[i].name){
                                        addRecord = false;
                                        expenses[j].prevYear = expenses2[i].total;
                                        break;
                                    }
                                }
                                if (addRecord){
                                    expenses.push({
                                        name: expenses2[i].name,
                                        total: 0,
                                        prevYear: expenses2[i].total
                                    });
                                }
                            }


                          //Render income
                            addHeader("Income", (year-1), year);
                            var totalIncome = 0;
                            var prevIncome = 0;
                            income.sort(function(a, b){return b.total - a.total;});
                            for (var i=0; i<income.length; i++){
                                var category = income[i];
                                totalIncome+=category.total;
                                prevIncome+=category.prevYear;
                                addRow(category);
                            }
                            addRow({
                                name: false,
                                total: totalIncome,
                                prevYear: prevIncome
                            });


                          //Render expenses
                            addHeader("Expenses");
                            var totalExpenses = 0;
                            var prevExpenses = 0;
                            for (var i=0; i<expenses.length; i++){
                                var expense = expenses[i];
                                totalExpenses+=expense.total;
                                prevExpenses+=expense.prevYear;
                                addRow(expense);
                            }
                            addRow({
                                name: false,
                                total: totalExpenses,
                                prevYear: prevExpenses
                            });


                            updatePanels();
                        }
                    });


                }
                else{

                  //Render income
                    addHeader("Income", "Monthly Avg", "YTD Total");
                    var totalIncome = 0;
                    income.sort(function(a, b){return b.total - a.total;});
                    for (var i=0; i<income.length; i++){
                        var category = income[i];
                        totalIncome+=category.total;
                        addRow(category);
                    }
                    addRow({
                        name: false,
                        total: totalIncome
                    });


                  //Render expenses
                    addHeader("Expenses");
                    var totalExpenses = 0;
                    for (var i=0; i<expenses.length; i++){
                        var category = expenses[i];
                        totalExpenses+=category.total;
                        addRow(category);
                    }
                    addRow({
                        name: false,
                        total: totalExpenses
                    });

                    updatePanels();
                }

            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** getTransactions
  //**************************************************************************
    var getTransactions = function(category, year){
        if (!category.id) return;

        var startDate = moment.tz(year + "-01-01 00:00", timezone).toISOString();
        var endDate = moment.tz((year+1) + "-01-01 00:00", timezone).toISOString();
        get("report/Transactions?categoryID=" + category.id +
            "&startDate=" + startDate + "&endDate=" + endDate,  {
            success: function(text){
                transactionsPanel.clear();
                transactionsPanel.setTitle(category.name);

                var arr = JSON.parse(text);
                for (var i=0; i<arr.length; i++){
                    var col = arr[i];
                    var id = col[0];
                    var date = col[1];
                    var desc = col[2];
                    var amount = col[3];
                    amount = createCell("currency", amount);
                    arr[i] = [
                        id,
                        date,
                        desc,
                        amount
                    ];
                }

                if (!transactionsPanel.isOpen()){
                    transactionsPanel.showAt(accountDetails.getWidth()+(spacing*3), spacing*3);
                }
                transactionsPanel.update(arr);
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** createMenu
  //**************************************************************************
    var createMenu = function(){
        var body = document.getElementsByTagName("body")[0];
        var callout = new javaxt.dhtml.Callout(body, {
            style: {
                panel: "callout-panel",
                arrow: "callout-arrow"
            }
        });

        var innerDiv = callout.getInnerDiv();
        var contentDiv = document.createElement("div");
        contentDiv.style.padding = "5px";
        innerDiv.appendChild(contentDiv);


        var form = new javaxt.dhtml.Form(contentDiv, {
            style: config.style.form,
            items: [
                {
                    name: "year",
                    label: "Year",
                    type: createComboBox({
                        style: config.style.combobox,
                        scrollbar: true
                    })
                },
                {
                    name: "type",
                    label: "Columns",
                    type: "radio",
                    alignment: "vertical",
                    options: [
                        {
                            label: "Show Montly Average",
                            value: "montlyAvg"
                        },
                        {
                            label: "Compare Previous Year",
                            value: "prevYear"
                        }
                    ]
                }
            ],
            buttons: [
                {
                    name: "Update",
                    onclick: function(){
                        var year = parseInt(form.getValue("year"));
                        var type = form.getValue("type");
                        getAccountSummary(accountDetails.account, year, type);
                        menu.hide();
                    }
                }
            ]
        });


        callout.onShow = function(){

          //Update type
            if (accountDetails.type){
                form.setValue("type", accountDetails.type);
            }
            else{
                form.setValue("type", "montlyAvg");
            }


          //Update year
            var year = form.findField("year");
            year.clear();
            var arr = accountDetails.years;
            if (arr){
                for (var i=0; i<arr.length; i++){
                    year.add(arr[i]);
                }

                if (accountDetails.year){
                    year.setValue(accountDetails.year);
                }
                else {
                    if (arr.length>0) year.setValue(arr[0]);
                }
            }
        };

        return callout;
    };


  //**************************************************************************
  //** createPanel
  //**************************************************************************
    var createPanel = function(parent, options){

        var div = document.createElement("div");

        var subtitleDiv = document.createElement("div");
        subtitleDiv.style.textAlign = "center";
        div.appendChild(subtitleDiv);

        var subtitle = document.createElement("div");
        subtitle.onclick = function(e){
            if (options.onSubTitle) options.onSubTitle(this, e);
        };
        subtitleDiv.appendChild(subtitle);


        var body = document.createElement("div");
        div.appendChild(body);


        var style = merge({}, config.style.window);
        style.header += " report-header";
        style.title += " report-title";
        style.button += " report-header-button";
        style.body = "report-body";
        if (options.style){
            if (options.style.body){
                style.body = options.style.body;
            }
        }

        var panel = new javaxt.dhtml.Window(parent, {
            title: options.title,
            body: div,
            style: style
        });

        panel.onClose = function(){
            if (options.onClose) options.onClose();
        };

        panel.clear = function(){
            panel.setTitle("");
            subtitle.innerHTML = "";
            body.innerHTML = "";
        };

        panel.setSubTitle = function(str){
            subtitle.className = "report-subtitle";
            subtitle.style.display = "inline-block";
            subtitle.innerHTML = str;
        };

        panel.update = function(content){
            if (typeof parent === "string"){
                body.innerHTML = content;
            }
            else{
                body.appendChild(content);
            }
        };

        return panel;
    };


  //**************************************************************************
  //** createComboBox
  //**************************************************************************
    var createComboBox = function(comboboxConfig){
        return new javaxt.dhtml.ComboBox(document.createElement("div"), comboboxConfig);
    };


  //**************************************************************************
  //** createCanvas
  //**************************************************************************
    var createCanvas = function(parent){
        var w = 250;
        var h = 250;
        var div = document.createElement("div");
        div.style.width = w+"px";
        div.style.height = h+"px";
        div.style.display = "inline-block";
        parent.appendChild(div);

        var canvas = document.createElement("canvas");
        canvas.style.width = w+"px";
        canvas.style.height = h+"px";
        canvas.width = w;
        canvas.height = h;
        div.appendChild(canvas);
        return canvas;
    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createCell = javaxt.express.finance.utils.createCell;
    var createDoughnut = javaxt.express.finance.utils.createDoughnut;
    var getAccounts = javaxt.express.finance.utils.getAccounts;
    var formatCurrency = javaxt.express.finance.utils.formatCurrency;

    init();

};