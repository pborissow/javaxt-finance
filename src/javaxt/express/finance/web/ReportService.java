package javaxt.express.finance.web;
import javaxt.http.servlet.ServletException;
import javaxt.express.ws.*;

import javaxt.sql.*;
import javaxt.json.*;
import javaxt.express.utils.StringUtils;

import java.io.IOException;

//******************************************************************************
//**  ReportService
//******************************************************************************
/**
 *   Provides a set of web methods used to generate custom reports
 *
 ******************************************************************************/

public class ReportService extends WebService {

  //**************************************************************************
  //** getUnlinkedTransactions
  //**************************************************************************
  /** Returns a count of linked vs unlinked transactions
   */
    public ServiceResponse getUnlinkedTransactions(ServiceRequest request, Database database)
        throws ServletException, IOException {

        String sql1 = "select 'linked' as name, count(id) as count from TRANSACTION where category_id is null";
        String sql2 = "select 'unlinked' as name, count(id) as count from TRANSACTION where category_id is not null";
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
}