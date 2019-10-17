if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

javaxt.express.finance.Reports = function(parent, config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {
        style: javaxt.express.finance.style
    };
    var mainDiv, reportDiv, transactionsPanel;
    var startDate, endDate, timezone;


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



        if (timezone==null || typeof timezone != 'string') timezone = "America/New_York";
        timezone = timezone.trim().replace(" ", "_");

        var year = 2018;
        startDate = moment.tz(year + "-01-01 00:00", timezone).toISOString();
        endDate = moment.tz((year+1) + "-01-01 00:00", timezone).toISOString();



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


      //Create main div
        mainDiv = document.createElement("div");
        mainDiv.style.height = "100%";
        td.appendChild(mainDiv);
        mainDiv.show = function(){
            this.style.visibility = '';
            this.style.display = '';
        };
        mainDiv.hide = function(){
            this.style.visibility = 'hidden';
            this.style.display = 'none';
        };


      //Create report divs
        reportDiv = createPanel(function(){
            if (transactionsPanel) transactionsPanel.hide();
            reportDiv.hide();
            mainDiv.show();
        });
        td.appendChild(reportDiv);
        transactionsPanel = createPanel(function(){
            transactionsPanel.hide();
        });
        td.appendChild(transactionsPanel);


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
                if (div) mainDiv.removeChild(div);
            }, me);

            accounts.addEventListener("update", function(account){
                var div = getReport(account);
                if (div){
                    div.innerHTML = account.name + " Account Balance";
                }
            }, me);
        });




        parent.appendChild(table);
        me.el = table;
    };


    var createPanel = function(onclick){

        var div = document.createElement("div");
        div.className = "report-panel";
        div.show = function(){
            this.style.visibility = '';
            this.style.display = '';
        };
        div.hide = function(){
            this.style.visibility = 'hidden';
            this.style.display = 'none';
        };
        div.hide();


        var buttonDiv = document.createElement("div");
        buttonDiv.style.position = "relative";
        div.appendChild(buttonDiv);

        var innerDiv = document.createElement("div");
        innerDiv.style.position = "absolute";
        innerDiv.style.top = 0;
        innerDiv.style.right = 0;
        innerDiv.style.width = "18px";
        innerDiv.style.height = "18px";
        innerDiv.style.zIndex = 1;
        innerDiv.style.cursor = "pointer";
        innerDiv.innerHTML = "&#x2715;";
        innerDiv.onclick = onclick;
        buttonDiv.appendChild(innerDiv);



        var contentDiv = document.createElement("div");
        contentDiv.style.position = "relative";
        div.appendChild(contentDiv);

        div.clear = function(){
            contentDiv.innerHTML = "";
        };

        div.update = function(content){
            if (typeof parent === "string"){
                contentDiv.innerHTML = content;
            }
            else{
                contentDiv.appendChild(content);
            }
        };

        return div;
    };


  //**************************************************************************
  //** getReport
  //**************************************************************************
    var getReport = function(account){
        for (var i=0; i<mainDiv.childNodes.length; i++){
            var div = mainDiv.childNodes[i];
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
        div.innerHTML = account.name + " Account Balance";
        div.account = account;
        div.onclick = function(){
            mainDiv.hide();
            showReport(this.account);
        };
        mainDiv.appendChild(div);
    };


  //**************************************************************************
  //** showReport
  //**************************************************************************
    var showReport = function(account){

        get("report/AccountSummary?accountID=" + account.id +
            "&startDate=" + startDate + "&endDate=" + endDate,  {
            success: function(text){
                var json = JSON.parse(text);
                var income = json.income;
                var expenses = json.expenses;


                reportDiv.clear();



                var table = createTable();
                table.style.height = "";
                var tbody = table.firstChild;
                var tr, td;



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


                var addHeader = function(title){
                    tr = document.createElement("tr");
                    tbody.appendChild(tr);
                    td = document.createElement("td");
                    td.className = "report-header";
                    td.colSpan = numColumns;
                    td.innerHTML = title;
                    tr.appendChild(td);
                };

                var addRow = function(category){
                    var isFooter = false;
                    if (!category.name) isFooter = true;
                    tr = document.createElement("tr");
                    tr.className = "report-row" + (isFooter? "-footer" : "");
                    tr.category = category;
                    tr.onclick = function(){
                        showDetails(this.category);
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
                    td.innerHTML = formatCurrency(category.total/12);
                    tr.appendChild(td);

                    td = document.createElement("td");
                    td.className = cls;
                    td.style.textAlign = "right";
                    td.innerHTML = formatCurrency(category.total);
                    tr.appendChild(td);
                };


                addHeader("Income");
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

                reportDiv.update(table);
                reportDiv.show();

            },
            failure: function(request){
                alert(request);
            }
        });
    };



  //**************************************************************************
  //** showDetails
  //**************************************************************************
    var showDetails = function(category){
        if (!category.id) return;

        get("report/Transactions?categoryID=" + category.id +
            "&startDate=" + startDate + "&endDate=" + endDate,  {
            success: function(text){
                transactionsPanel.clear();

                var div = document.createElement("div");
                div.style.width = "600px";
                div.style.height = "600px";

                var table = new javaxt.dhtml.Table(div, {
                    style: {
                        row: "report-row",
                        column: "report-cell"
                    },
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

                table.addRows(arr);


                table.onSelectionChange = function(rows){
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
                transactionsPanel.show();
            },
            failure: function(request){
                alert(request);
            }
        });


    };


  //**************************************************************************
  //** Utils
  //**************************************************************************
    var get = javaxt.dhtml.utils.get;
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createCell = javaxt.express.finance.utils.createCell;
    var getAccounts = javaxt.express.finance.utils.getAccounts;
    var formatCurrency = javaxt.express.finance.utils.formatCurrency;

    init();

};