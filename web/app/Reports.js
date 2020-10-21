if(!javaxt) var javaxt={};
if(!javaxt.express) javaxt.express={};
if(!javaxt.express.finance) javaxt.express.finance={};

//******************************************************************************
//**  Reports
//******************************************************************************
/**
 *   Panel used to render a list of reports
 *
 ******************************************************************************/

javaxt.express.finance.Reports = function(parent, config) {

    var me = this;
    var orgConfig = config;
    var defaultConfig = {
        style: javaxt.express.finance.style,
        dateFormat: "M/d/yyyy",
        timezone: "America/New_York"
    };
    var mainDiv;
    var reportList, menu;
    var accountDetails, pieChart, barGraph, transactionsPanel; //windows/panels
    var vendors, sources, sourceAccounts; //DataStores
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


      //Update timezone
        config.timezone = config.timezone.trim().replace(" ", "_");


      //Create main div
        mainDiv = document.createElement("div");
        mainDiv.style.height = "100%";
        parent.appendChild(mainDiv);
        me.el = mainDiv;



      //Create container for reports
        reportList = document.createElement("div");
        reportList.style.height = "100%";
        mainDiv.appendChild(reportList);
        reportList.show = function(callback){
            config.fx.fadeIn(this, "easeInOutCubic", 600, callback);
        };
        reportList.hide = function(callback){
            config.fx.fadeOut(this, "easeInOutCubic", 600, callback);
        };



        getSources(orgConfig, function(){
            vendors = orgConfig.vendors;
            sources = orgConfig.sources;
            sourceAccounts = orgConfig.sourceAccounts;
        });


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
                showReport(account);
            });
        };
        reportList.appendChild(div);
    };


  //**************************************************************************
  //** showReport
  //**************************************************************************
    var showReport = function(account){

        get("report/DistinctYears?accountID=" + account.id, {
            success: function(text){
                var years = JSON.parse(text);
                var year = years.length>0 ? years[0] : new Date().getFullYear();


                getAccountSummary(account, year, function(income, expenses){
                    renderAccountSummary(income, expenses, account, year, years.length==1 ? "montlyAvg" : "prevYear");
                    accountDetails.years = years;

                    setTimeout(function(){
                        if (!pieChart) createPieChart(mainDiv);
                        var h = (accountDetails.getHeight()/2)-spacing;
                        if (h<280) h = 280;
                        pieChart.setHeight(h);
                        pieChart.showAt(accountDetails.getWidth()+(spacing*2), spacing);
                        pieChart.update(expenses);


                        get("report/MonthlyTotals?accountID=" + account.id + "&year=" + year + "-" + (year-1), {
                            success: function(text){
                                var json = JSON.parse(text);
                                if (!barGraph) createBarGraph(mainDiv);
                                barGraph.setHeight(280); //(accountDetails.getHeight()/2)-spacing
                                barGraph.showAt(accountDetails.getWidth()+(spacing*2), pieChart.getHeight()+(spacing*2));
                                barGraph.update(json);
                            }
                        });

                    },200);

                });
            }
        });
    };


  //**************************************************************************
  //** getAccountSummary
  //**************************************************************************
    var getAccountSummary = function(account, year, callback){
        var startDate = moment.tz(year + "-01-01 00:00", config.timezone).toISOString();
        var endDate = moment.tz((year+1) + "-01-01 00:00", config.timezone).toISOString();
        get("report/AccountSummary?accountID=" + account.id +
            "&startDate=" + startDate + "&endDate=" + endDate,  {
            success: function(text){
                var json = JSON.parse(text);
                var income = json.income;
                var expenses = json.expenses;
                if (callback) callback.apply(me, [income, expenses]);
            },
            failure: function(request){
                alert(request);
            }
        });
    };


  //**************************************************************************
  //** renderAccountSummary
  //**************************************************************************
  /** Used to render income and expenses for a given account
   */
    var renderAccountSummary = function(income, expenses, account, year, type){

        if (!accountDetails){
            accountDetails = createPanel(mainDiv, {
                onClose: function(){
                    if (transactionsPanel) transactionsPanel.hide();
                    if (pieChart) pieChart.hide();
                    if (barGraph) barGraph.hide();
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
        }


        accountDetails.account = account;
        accountDetails.year = year;
        accountDetails.type = type;

        var comparePreviousYear = (type==="prevYear");


        accountDetails.clear();
        accountDetails.setTitle(account.name + " Account");
        accountDetails.setSubTitle( (comparePreviousYear?((year-1)+"-") : "") + year);


      //Create table
        var table = createTable();
        table.style.height = "";
        var tbody = table.firstChild;
        var tr, td;
        var rows = [];


      //Watch for up/down key events
        tbody.tabIndex = -1;
        tbody.onmouseover = function(){
            this.focus();
        };
        tbody.addEventListener("keyup", function(e){
            var up = (e.keyCode===38);
            var down = (e.keyCode===40);
            if (up || down){
                for (var i=0; i<rows.length; i++){
                    var row = rows[i];
                    if (row.className.indexOf("report-row-selected")>-1){
                        if (down && i<rows.length-1) rows[i+1].click();
                        if (up && i>0) rows[i-1].click();
                        break;
                    }
                }
            }
        });


      //Create "phantom" header row to set up spacing
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
        };


        if (comparePreviousYear){

            getAccountSummary(account, year-1, function(income2, expenses2){

              //Update income records
                for (var i=0; i<income.length; i++){income[i].prevYear=0;}
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
    };


  //**************************************************************************
  //** createPieChart
  //**************************************************************************
    var createPieChart = function(parent){
        pieChart = createPanel(parent, {
            title: "Expense Summary",
            closable: false,
            width: "475px"
        });
        var div = document.createElement("div");
        div.style.padding = "15px";
        var canvas = createCanvas(div, {
            width: "250px",
            height: "250px"
        });
        var chart = createDoughnut(canvas, {cutout: 60});
        var legend = addLegend(canvas);
        pieChart.update(div);
        pieChart.update = function(expenses){
            legend.clear();

            var dataset = chart.data.datasets[0];
            dataset.data = [];


            for (var i=0; i<expenses.length; i++){
                //var name = expenses[i].name;
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

                if (i<=colors.length){
                    var name = expenses[i].name;
                    if (i===colors.length){
                        name = "Other";
                        color = "#e5e5e5";
                    }
                    legend.addItem(name, color);
                }
            }
            dataset.hoverBackgroundColor = dataset.backgroundColor;

            chart.update();
        };
    };


  //**************************************************************************
  //** createBarGraph
  //**************************************************************************
    var createBarGraph = function(parent){
        barGraph = createPanel(parent, {
            title: "Monthly Expenses",
            closable: false,
            width: "475px"
        });
        var div = barGraph.getBody();
        div.style.minWidth = "450px";
        div.style.minHeight = "250px";
        div.style.padding = "10px 5px";
        var canvas = createCanvas(div);
        var chart = createBargraph(canvas, {});
        var legend = addLegend(canvas);
        barGraph.update = function(monthlyTotals){
            legend.clear();

          //Create datasets
            var datasets = [];
            for (var key in monthlyTotals) {
                if (monthlyTotals.hasOwnProperty(key)){
                    var arr = [];
                    var expenses = monthlyTotals[key].expenses;
                    for (var i=0; i<expenses.length; i++){
                        arr.push(-expenses[i]);
                    }
                    datasets.push({
                        label: key, //year
                        backgroundColor: "blue",
                        data: arr
                    });
                }
            }

          //Update colors
            var colorRange = ['#ff6364','#fff383','#12b7d3'];
            var colorScale = chroma.scale(colorRange);
            var colors = {};
            for (var i=0; i<datasets.length; i++){
                var p = i/(datasets.length-1);
                var color = colorScale(p).css();
                datasets[i].backgroundColor = color;
                colors[datasets[i].label + ""] = color;
            }


            for (var key in monthlyTotals) {
                if (monthlyTotals.hasOwnProperty(key)){
                    var arr = [];
                    var expenses = monthlyTotals[key].expenses;
                    for (var i=0; i<expenses.length; i++){
                        var val = -expenses[i];
                        var prevVal = i>0 ? arr[i-1] : 0;
                        arr.push(val+prevVal);
                    }
                    datasets.push({
                        label: key, //year
                        data: arr,
                        type: 'line',
                        fill: false,
                        borderColor: colors[key],
                        // this dataset is drawn on top
                        order: 2
                    });
                }
            }



          //Update chart
            chart.data.labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            chart.data.datasets = datasets;
            chart.update();
        };
    };


  //**************************************************************************
  //** createTransactionPanel
  //**************************************************************************
    var createTransactionPanel = function(parent){

      //Create panel
        transactionsPanel = createPanel(parent, {
            width: "600px",
            height: "640px",
            onClose: function(){
                console.log("Update charts!");
            },
            style: {
                body: {
                    padding: "0 0 5px 0",
                    verticalAlign: "top"
                }
            }
        });


      //Create table with 2 rows
        var table = createTable();
        var tbody = table.firstChild;
        var tr, td;

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.className = "panel-toolbar";
        tr.appendChild(td);
        var toolbar = document.createElement('div');
        td.appendChild(toolbar);

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.style.width = "100%";
        td.style.height = "100%";
        tr.appendChild(td);


      //Create data table/grid
        var columns = [
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
                header: "Source",
                width: 120
            },
            {
                header: "Desciption",
                width: "100%"
            },
            {
                header: "Amount",
                width: 100,
                align: "right"
            }
        ];
        var grid = new javaxt.dhtml.Table(td, {
            style: config.style.table,
            columns: columns
        });
        grid.onSelectionChange = function(rows){
            for (var i=0; i<rows.length; i++){
                var row = rows[i];
                if (row.selected){
                    var transactionID = parseInt(row.get(0));
                    console.log("Edit transaction " + transactionID);
                    break;
                }
            }
        };


      //Append table and refactor the update method
        transactionsPanel.update(table);
        transactionsPanel.update = function(arr){
            grid.addRows(arr);
        };

        transactionsPanel.clear = function(){
            grid.clear();
        };



      //Add toolbar buttons
        var isMobile = false;
        var downloadButton = createButton(toolbar, {
            label: "Download",
            icon: "downloadIcon",
            hidden: isMobile
        });
        var link;
        downloadButton.onClick = function(){

          //Create csv
            var csvContent = "data:text/csv;charset=utf-8,";

          //Add csv header
            for (var i=0; i<columns.length; i++){
                if (i>0) csvContent += ",";
                csvContent += columns[i].header;
            }
            csvContent += "\r\n";


          //Add csv data
            grid.forEachRow(function (row, content) {
                var row = "";
                for (var i=0; i<content.length; i++){
                    if (i>0) row += ",";
                    var cell = content[i];
                    if (!(typeof cell === "string")){
                        cell = cell.innerText;
                    }
                    if (cell.indexOf(",")>-1) cell = "\"" + cell + "\"";
                    cell = cell.replace("#",""); //TODO: find proper way to encode characters like this
                    row += cell;
                }
                csvContent += row + "\r\n";
            });


            var encodedUri = encodeURI(csvContent);
            if (!link){
                link = document.createElement("a");
                document.body.appendChild(link);
            }
            var title = transactionsPanel.getTitle();
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", title + ".csv");
            link.click();
        };
    };


  //**************************************************************************
  //** getTransactions
  //**************************************************************************
    var getTransactions = function(category, year){
        if (transactionsPanel){
            transactionsPanel.setTitle("");
            transactionsPanel.clear();
        }


        if (!category.id){
            if (transactionsPanel) transactionsPanel.hide();
            if (barGraph) console.log("show all expenses");
            return;
        }


        var startDate = moment.tz((year-1) + "-01-01 00:00", config.timezone).toISOString();
        var endDate = moment.tz((year+1) + "-01-01 00:00", config.timezone).toISOString();


        var fields = "id,date,description,amount,categoryID,sourceID";
        var where = "category_id=" + category.id + " and (date>='" + startDate + "' and date<'" + endDate + "')";
        var orderBy = "date desc";
        var url = "transactions?where=" + encodeURIComponent(where) + "&fields=" + fields + "&orderBy=" + encodeURIComponent(orderBy);

        get(url, {
            success: function(text, xml, url, request){
                if (!transactionsPanel) createTransactionPanel(mainDiv);
                transactionsPanel.clear();
                transactionsPanel.setTitle(category.name);

                var records = [];
                var monthlyTotals = {};
                var transactions = normalizeResponse(request);
                for (var i=0; i<transactions.length; i++){
                    var transaction = transactions[i];
                    var id = transaction.id;
                    var date = transaction.date;
                    var desc = transaction.description;
                    var amount = transaction.amount;
                    var sourceID = transaction.sourceID;

                    var m = moment.tz(date, config.timezone);
                    if (m.year()===year){
                        records.push([
                            id,
                            createCell("date", m, config.dateFormat),
                            createCell("source", findSource(sourceID)),
                            desc,
                            createCell("currency", amount)
                        ]);
                    }

                    var key = m.year()+"";
                    var json = monthlyTotals[key];
                    if (!json){
                        json = {
                            income: [0,0,0,0,0,0,0,0,0,0,0,0],
                            expenses: [0,0,0,0,0,0,0,0,0,0,0,0]
                        };
                        monthlyTotals[key] = json;
                    }

                  //if (category.isExpense) then merge debits and credits
                    monthlyTotals[key].expenses[m.month()]+= amount;
                }

                if (!transactionsPanel.isOpen()){
                    var x = accountDetails.getWidth()+(spacing*2);
                    if (pieChart){ //and is pieChart in default position...
                        x += pieChart.getWidth()+spacing;
                    }
                    transactionsPanel.showAt(x, spacing);
                }
                transactionsPanel.update(records);


                barGraph.update(monthlyTotals);
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
                        var account = accountDetails.account;
                        getAccountSummary(account, year, function(income, expenses){
                            renderAccountSummary(income, expenses, account, year, type);
                        });

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
  /** Returns a custom window used to render charts, graphs, etc
   */
    var createPanel = function(parent, options){

        var div = document.createElement("div");
        div.style.height = "100%";

        var subtitleDiv = document.createElement("div");
        subtitleDiv.style.textAlign = "center";
        div.appendChild(subtitleDiv);

        var subtitle = document.createElement("div");
        subtitle.onclick = function(e){
            if (options.onSubTitle) options.onSubTitle(this, e);
        };
        subtitleDiv.appendChild(subtitle);


        var body = document.createElement("div");
        body.style.height = "100%";
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
            width: options.width,
            height: options.height,
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

        panel.getBody = function(){
            return body;
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
    var createCanvas = function(parent, style){

        var width, height;
        if (style){
            width = style.width;
            height = style.height;
        }

      //Create main div
        var outerDiv = document.createElement("div");
        outerDiv.style.position = "relative";
        outerDiv.style.width = "100%";
        outerDiv.style.height = "100%";
        outerDiv.style.overflow = "hidden";
        parent.appendChild(outerDiv);


      //Create inner div
        var innerDiv = document.createElement("div");
        innerDiv.style.position = "absolute";
        innerDiv.style.width = width ? width : "100%";
        innerDiv.style.height = height ? height : "100%";
        outerDiv.appendChild(innerDiv);


      //Create canvas
        var canvas = document.createElement('canvas');
        if (width && height){
            var w = parseInt(width);
            var h = parseInt(height);
            canvas.style.width = w+"px";
            canvas.style.height = h+"px";
            canvas.width = w;
            canvas.height = h;
        }
        canvas.clear = function(){
            var ctx = this.getContext('2d');
            ctx.clearRect(0, 0, this.width, this.height);
        };
        innerDiv.appendChild(canvas);


        return canvas;
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
    var merge = javaxt.dhtml.utils.merge;
    var createTable = javaxt.dhtml.utils.createTable;
    var createCell = javaxt.express.finance.utils.createCell;
    var createButton = javaxt.express.finance.utils.createButton;

    var createDoughnut = javaxt.express.finance.utils.createDoughnut;
    var createBargraph = javaxt.express.finance.utils.createBargraph;
    var addLegend = javaxt.express.finance.utils.addLegend;

    var formatCurrency = javaxt.express.finance.utils.formatCurrency;
    var getMomentFormat = javaxt.express.finance.utils.getMomentFormat;

    var getSources = javaxt.express.finance.utils.getSources;
    var getAccounts = javaxt.express.finance.utils.getAccounts;
    var normalizeResponse = javaxt.express.finance.utils.normalizeResponse;

    init();

};