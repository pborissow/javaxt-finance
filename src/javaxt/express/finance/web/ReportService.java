package javaxt.express.finance.web;
import javaxt.express.finance.*;

import javaxt.http.servlet.ServletException;
import javaxt.express.ws.*;

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
  //** getTransactions
  //**************************************************************************
  /** Returns a list of transactions associated with a given account and
   *  category
   */
    public ServiceResponse getTransactions(ServiceRequest request, Database database)
        throws ServletException, IOException {

      //Get category ID
        Long categoryID = request.getParameter("categoryID").toLong();
        if (categoryID==null){
            Long accountID = getAccountID(request);
            String categoryName = request.getParameter("category").toString();

            if (categoryName!=null && accountID!=null){
                try{
                    categoryID = Category.find("account_id=", accountID, "name=", categoryName)[0].getID();
                }
                catch(Exception e){
                }
            }
        }
        if (categoryID==null) new ServiceResponse(400, "Category name or ID is required");




      //Get date filter
        String dateFilter = getDateFilter(request);
        if (dateFilter==null) dateFilter = "";
        else dateFilter = " AND " + dateFilter + " ";


        String sql = "select id, date, description, amount from transaction " +
        "where category_id=" + categoryID + " " + dateFilter +
        "order by date desc";


        StringBuilder str = new StringBuilder();
        str.append("[");
        Connection conn = null;
        try{
            int x = 0;
            conn = database.getConnection();
            for (Recordset rs : conn.getRecordset(sql)){
                if (x>0) str.append(",");
                JSONArray arr = new JSONArray();
                arr.add(rs.getValue("id").toLong());
                arr.add(rs.getValue("date").toDate());
                arr.add(rs.getValue("description").toString());
                arr.add(rs.getValue("amount").toBigDecimal());
                str.append(arr.toString());
                x++;
            }
            conn.close();
            str.append("]");
            ServiceResponse response = new ServiceResponse(str.toString());
            response.setContentType("application/json");
            return response;
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