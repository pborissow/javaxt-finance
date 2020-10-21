package javaxt.express.finance.web;
import javaxt.express.finance.*;

import javaxt.express.WebService;
import javaxt.express.ServiceResponse;
import javaxt.express.ServiceRequest;
import javaxt.http.servlet.ServletException;

import javaxt.sql.*;
import javaxt.json.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

//******************************************************************************
//**  ReportService
//******************************************************************************
/**
 *   Provides a set of web methods used to generate custom reports
 *
 ******************************************************************************/

public class ReportService extends WebService {


  //**************************************************************************
  //** getLinkStatus
  //**************************************************************************
  /** Returns a count of linked vs unlinked transactions
   */
    public ServiceResponse getLinkStatus(ServiceRequest request, Database database)
        throws ServletException, IOException {

        String sql1 = "select 'linked' as name, count(id) as count from TRANSACTION where category_id is not null";
        String sql2 = "select 'unlinked' as name, count(id) as count from TRANSACTION where category_id is null";
        String sql = sql1 + "\n union \n" + sql2;

        Connection conn = null;
        try{
            JSONObject json = new JSONObject();
            conn = database.getConnection();
            for (Recordset rs : conn.getRecordset(sql)){
                String name = rs.getValue("name").toString();
                Long count = rs.getValue("count").toLong();
                json.set(name, count);
            }
            conn.close();

            return new ServiceResponse(json);
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** getTransactionsPerAccount
  //**************************************************************************
  /** Returns the total number of transactions for each account.
   */
    public ServiceResponse getTransactionsPerAccount(ServiceRequest request, Database database)
        throws ServletException, IOException {

        String sql = "select account.name, count(transaction.id) as count " +
        "from transaction left join category on transaction.category_id=category.id left join account on category.account_id=account.id " +
        "group by account.name";


        Connection conn = null;
        try{
            conn = database.getConnection();

          //Generate list of accounts
            JSONObject json = new JSONObject();
            for (Recordset rs : conn.getRecordset("select name from account order by id")){
                json.set(rs.getValue(0).toString(), 0);
            }
            json.set("N/A", 0);


          //Update counts
            for (Recordset rs : conn.getRecordset(sql)){
                String name = rs.getValue("name").toString();
                Long count = rs.getValue("count").toLong();
                if (name==null) name = "N/A";
                json.set(name, count);
            }

          //Close connection and return response
            conn.close();
            return new ServiceResponse(json);
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** getAccountSummary
  //**************************************************************************
  /** Used to sum all the transactions by category for a given account
   */
    public ServiceResponse getAccountSummary(ServiceRequest request, Database database)
        throws ServletException, IOException {

        Long accountID = getAccountID(request);
        if (accountID==null) new ServiceResponse(400, "Account name or ID is required");


        String dateFilter = getDateFilter(request);
        if (dateFilter==null) dateFilter = "";
        else dateFilter = " AND " + dateFilter + " ";


        String sql = "select category.id, sum(transaction.amount) as total " +
        "from transaction left join category on transaction.category_id=category.id " +
        "where account_id=" + accountID + " " + dateFilter +
        "group by category.id order by total";



        Connection conn = null;
        try{
            conn = database.getConnection();


          //Generate a list of income and expense categories
            HashMap<Long, JSONObject> income = new HashMap<>();
            HashMap<Long, JSONObject> expenses = new HashMap<>();
            for (Recordset rs : conn.getRecordset("select id, name, is_expense from category where account_id="+accountID)){
                JSONObject json = new JSONObject();
                long id = rs.getValue("id").toLong();
                boolean isExpense = rs.getValue("is_expense").toBoolean();
                json.set("id", id);
                json.set("name", rs.getValue(1).toString());
                if (isExpense) expenses.put(id, json);
                else income.put(id, json);
            }



          //Execute query
            JSONArray a = new JSONArray();
            JSONArray b = new JSONArray();
            for (Recordset rs : conn.getRecordset(sql)){
                long id = rs.getValue("id").toLong();
                BigDecimal total = rs.getValue("total").toBigDecimal();

                if (expenses.containsKey(id)){
                    JSONObject expense = expenses.get(id);
                    expense.set("total", total);
                    b.add(expense);
                }
                else{
                    JSONObject json = income.get(id);
                    json.set("total", total);
                    a.add(json);
                }
            }

            conn.close();

            JSONObject json = new JSONObject();
            json.set("income", a);
            json.set("expenses", b);
            return new ServiceResponse(json);
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** getMonthlyTotals
  //**************************************************************************
    public ServiceResponse getMonthlyTotals(ServiceRequest request, Database database)
        throws ServletException, IOException {

        Long accountID = getAccountID(request);
        if (accountID==null) new ServiceResponse(400, "Account name or ID is required");

        String years = request.getParameter("year").toString();
        if (years==null) new ServiceResponse(400, "year is required");

        String timezone = request.getParameter("timezone").toString();
        if (timezone==null) timezone = "UTC";


      //Set start/end dates
        try{
            int startYear, endYear;
            if (years.contains("-")){
                String[] arr = years.split("-");
                startYear = Integer.parseInt(arr[0]);
                endYear = Integer.parseInt(arr[1]);
                if (endYear<startYear){
                    int s = startYear;
                    startYear = endYear;
                    endYear = s;
                }
                endYear += 1;
            }
            else{
                startYear = Integer.parseInt(years);
                endYear = startYear+1;
            }

            javaxt.utils.Date startDate = new javaxt.utils.Date("1/1/"+startYear);
            startDate.removeTimeStamp();
            startDate.setTimeZone(timezone);

            javaxt.utils.Date endDate = startDate.clone();
            endDate.add(endYear-startYear, "year");

            request.setParameter("startDate", startDate.toISOString());
            request.setParameter("endDate", endDate.toISOString());
        }
        catch(Exception e){}


      //Compile sql
        String sql = "select transaction.amount, transaction.date, is_expense " +
        "from transaction left join category on transaction.category_id=category.id " +
        "where account_id=" + accountID + " AND " + getDateFilter(request) + " " +
        "order by date";


      //Execute query and generate response
        Connection conn = null;
        try{
            conn = database.getConnection();

            HashMap<Integer, TreeMap<Integer, BigDecimal>> income = new HashMap<>();
            HashMap<Integer, TreeMap<Integer, BigDecimal>> expenses = new HashMap<>();

            for (Recordset rs : conn.getRecordset(sql)){
                javaxt.utils.Date date = rs.getValue("date").toDate();
                BigDecimal amount = rs.getValue("amount").toBigDecimal();
                boolean isExpense = rs.getValue("is_expense").toBoolean();

                HashMap<Integer, TreeMap<Integer, BigDecimal>> map = isExpense ? expenses : income;


                date.setTimeZone(timezone);
                int year = date.getYear();
                TreeMap<Integer, BigDecimal> months = map.get(year);
                if (months==null){
                    months = new TreeMap<>();
                    map.put(year, months);
                }

                int month = date.getMonth();
                BigDecimal currAmount = months.get(month);
                if (currAmount==null) currAmount = new BigDecimal(0.0);
                months.put(month, currAmount.add(amount));
            }

            conn.close();


            JSONObject json = new JSONObject();
            TreeSet<Integer> keys = new TreeSet<>();
            keys.addAll(income.keySet());
            keys.addAll(expenses.keySet());
            Iterator<Integer> it = keys.descendingIterator();
            while (it.hasNext()){
                int year = it.next();
                JSONObject _year = new JSONObject();
                json.set(year+"", _year);

                JSONArray arr;
                TreeMap<Integer, BigDecimal> months;

                arr = new JSONArray();
                months = income.get(year);
                for (int i=0; i<12; i++){
                    BigDecimal amount = months==null ? null : months.get(i+1);
                    if (amount==null) amount = new BigDecimal(0.0);
                    arr.add(amount);
                }
                _year.set("income", arr);

                arr = new JSONArray();
                months = expenses.get(year);
                for (int i=0; i<12; i++){
                    BigDecimal amount = months==null ? null : months.get(i+1);
                    if (amount==null) amount = new BigDecimal(0.0);
                    arr.add(amount);
                }
                _year.set("expenses", arr);
            }

            return new ServiceResponse(json);
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** getDistinctYears
  //**************************************************************************
  /** Returns a distinct list of years found in the transaction table.
   *  Provides an option to filter dates by account. Note that this method
   *  currently does not account for timezones with may yield unexpected
   *  results.
   */
    public ServiceResponse getDistinctYears(ServiceRequest request, Database database)
        throws ServletException, IOException {

        Long accountID = getAccountID(request);

        String sql = "select distinct(year(date)) as year from ";
        if (accountID==null){
            sql += "TRANSACTION";
        }
        else{
            sql += "transaction left join category on transaction.category_id=category.id " +
            "where account_id=" + accountID;
        }
        sql += " order by year desc";


        Connection conn = null;
        try{
            conn = database.getConnection();
            JSONArray arr = new JSONArray();
            for (Recordset rs : conn.getRecordset(sql)){
                arr.add(rs.getValue(0).toInteger());
            }
            conn.close();
            return new ServiceResponse(arr);
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** getAccountID
  //**************************************************************************
    private Long getAccountID(ServiceRequest request){
        Long accountID = request.getParameter("accountID").toLong();
        if (accountID==null){
            String accountName = request.getParameter("account").toString();
            if (accountName!=null){
                try{
                    accountID = Account.find("name=", accountName)[0].getID();
                }
                catch(Exception e){
                }
            }
        }
        return accountID;
    }


  //**************************************************************************
  //** getDateFilter
  //**************************************************************************
    private String getDateFilter(ServiceRequest request){
        javaxt.utils.Date startDate = request.getParameter("startDate").toDate();
        javaxt.utils.Date endDate = request.getParameter("endDate").toDate();
        if (startDate==null && endDate==null) return null;
        StringBuilder str = new StringBuilder();
        if (startDate!=null){
            str.append("date>='");
            str.append(startDate.toISOString());
            str.append("'");
            if (endDate!=null){
                str.append(" and ");
            }
        }
        if (endDate!=null){
            str.append("date<'");
            str.append(endDate.toISOString());
            str.append("'");
        }

        return "(" + str.toString() + ")";
    }
}