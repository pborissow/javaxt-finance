package javaxt.express.finance.web;
import javaxt.express.finance.*;

import javaxt.express.WebService;
import javaxt.express.ServiceResponse;
import javaxt.express.ServiceRequest;

import javaxt.io.Jar;
import javaxt.sql.*;
import javaxt.json.*;
import javaxt.http.servlet.*;

import java.util.*;
import java.io.IOException;
import java.sql.SQLException;

//******************************************************************************
//**  WebServices
//******************************************************************************
/**
 *   Used to handle calls to service endpoints
 *
 ******************************************************************************/

public class WebServices extends WebService {

    private Database database;
    private ReportService reportService;
    private QueryService queryService;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public WebServices(Database database, JSONObject config) throws Exception {
        this.database = database;


      //Register classes that this service will support
        Jar jar = new Jar(this);
        Jar.Entry[] jarEntries = jar.getEntries();
        for (Jar.Entry entry : jar.getEntries()){
            String name = entry.getName();
            if (name.endsWith(".class")){
                name = name.substring(0, name.length()-6).replace("/", ".");
                Class c = Class.forName(name);
                if (javaxt.sql.Model.class.isAssignableFrom(c)){
                    addClass(c);
                }
            }
        }


      //Instantiate additional services
        reportService = new ReportService();
        queryService = new QueryService(database, config);

    }


  //**************************************************************************
  //** processRequest
  //**************************************************************************
  /** Used to process an HTTP request and generate an HTTP response.
   */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {


        if (request.isWebSocket()){
            //processWebSocketRequest(service, request, response);
        }
        else{

          //Process request
            ServiceResponse rsp = getServiceResponse(new ServiceRequest(request));
            int status = rsp.getStatus();



          //Set general response headers
            response.setContentType(rsp.getContentType());
            response.setStatus(status == 501 ? 404 : status);



          //Set authentication header as needed
            String authMessage = rsp.getAuthMessage();
            String authType = request.getAuthType();
            if (authMessage!=null && authType!=null){
                if (authType.equalsIgnoreCase("BASIC")){
                    response.setHeader("WWW-Authenticate", "Basic realm=\"" + authMessage + "\"");
                }
            }


          //Send payload
            Object obj = rsp.getResponse();
            if (obj instanceof java.io.InputStream){
                Long contentLength = rsp.getContentLength();
                if (contentLength!=null){
                    response.setHeader("Content-Length", contentLength+"");
                }

                java.io.InputStream inputStream = (java.io.InputStream) obj;
                response.write(inputStream, true);
                inputStream.close();
            }
            else if (obj instanceof javaxt.io.File){
                javaxt.io.File file = (javaxt.io.File) obj;
                response.write(file.toFile(), file.getName(), file.getContentType(), true);
            }
            else{
                response.write((byte[]) obj, true);
            }
        }
    }


  //**************************************************************************
  //** getServiceResponse
  //**************************************************************************
  /** Maps a ServiceRequest to a WebService. Returns a ServiceResponse object
   *  to send back to the client.
   */
    private ServiceResponse getServiceResponse(ServiceRequest request)
        throws ServletException {


      //Authenticate request
        try{
            request.authenticate();
        }
        catch(Exception e){
            return new ServiceResponse(403, "Not Authorized");
        }



      //Process service request
        String service = request.getPath(0).toString();
        if (service.equals("report")){
            request = new ServiceRequest(service, request.getRequest());
            return reportService.getServiceResponse(request, database);
        }
        else if (service.equals("sql")){
            request = new ServiceRequest(service, request.getRequest());
            return queryService.getServiceResponse(request, database);
        }
        else if (service.equalsIgnoreCase("transactions")){
            if (request.getRequest().getMethod().equals("POST")){
                return addTransactions(request);
            }
            else{
                return getServiceResponse(request, database);
            }
        }
        else if (service.equalsIgnoreCase("linkTransaction")){
            return linkTransaction(request);
        }
        else if (service.equalsIgnoreCase("runRules")){
            return runRules(request);
        }
        else{
            return getServiceResponse(request, database);
        }
    }


  //**************************************************************************
  //** linkTransaction
  //**************************************************************************
  /** Used to assign a category to a transaction
   */
    public ServiceResponse linkTransaction(ServiceRequest request)
        throws ServletException {

        Long id = request.getID();
        Long categoryID = request.getParameter("categoryID").toLong();

        if (id==null) new ServiceResponse(400, "Missing id. Transaction ID is required");
        if (categoryID==null) new ServiceResponse(400, "Missing categoryID. Category ID is required");

        Connection conn = null;
        try{
            conn = database.getConnection();
            conn.execute("update transaction set category_id=" + categoryID + " where id="+id);
            conn.close();
            return new ServiceResponse(200);
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** addTransactions
  //**************************************************************************
  /** Used to import transactions uploaded by the client
   */
    private ServiceResponse addTransactions(ServiceRequest request)
        throws ServletException {

        try{
            JSONObject json = request.getJson();
            long sourceID = json.get("source").toLong();
            String[] data = json.get("data").toString().split("\n");


            Source source = new Source(sourceID);
            javaxt.express.finance.utils.Parser parser =
            new javaxt.express.finance.utils.Parser(source.getTemplate());


            JSONArray errors = new JSONArray();
            int x = 0;
            for (Transaction tx : parser.getTransactions(data)){
                try{
                    tx.setSource(source);
                    tx.save();
                }
                catch(SQLException e){
                    String msg = e.getMessage();
                    if (msg.length()>100) msg = msg.substring(0, 100);
                    JSONObject err = new JSONObject();
                    err.set("msg", msg);
                    err.set("idx", x);
                    errors.add(err);
                }
                x++;
            }

            if (errors.isEmpty()){
                return new ServiceResponse(200);
            }
            else{
                return new ServiceResponse(errors);
            }
        }
        catch(Exception e){
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** runRules
  //**************************************************************************
    public ServiceResponse runRules(ServiceRequest request)
        throws ServletException {

        Connection conn = null;
        try{
            conn = database.getConnection();


          //Fetch valid category IDs
            HashSet<Long> categoryIDs = new HashSet<>();
            for (Recordset rs : conn.getRecordset("select id from category")){
                categoryIDs.add(rs.getValue(0).toLong());
            }


          //Fetch active rules
            ArrayList<JSONObject> rules = new ArrayList<>();
            for (Recordset rs : conn.getRecordset("select info from rule where active=true order by name desc")){
                JSONObject rule = new JSONObject(rs.getValue(0).toString());
                Long categoryID = rule.get("categoryID").toLong();
                if (categoryID!=null){
                    if (categoryIDs.contains(categoryID)) rules.add(rule);
                }
            }


          //Match rules to transactions
            HashMap<Long, Long> updates = new HashMap<>();
            Recordset rs = new Recordset();
            rs.setFetchSize(1000);
            rs.open("select id, description from transaction where category_id is null", conn);
            while (rs.hasNext()){
                long id = rs.getValue("id").toLong();
                String description = rs.getValue("description").toString();
                for (JSONObject rule : rules){
                    Long categoryID = getCategoryID(description, rule);
                    if (categoryID!=null){
                        updates.put(id, categoryID);
                        break;
                    }
                }
                rs.moveNext();
            }
            rs.close();


          //Execute updates and generate response
            StringBuilder str = new StringBuilder("[");
            Iterator<Long> it = updates.keySet().iterator();
            while (it.hasNext()){
                long transactionID = it.next();
                long categoryID = updates.get(transactionID);

              //Execute update
                conn.execute("update transaction set category_id=" + categoryID + " where id=" + transactionID);

              //Update response
                str.append("[");
                str.append(transactionID);
                str.append(",");
                str.append(categoryID);
                str.append("]");
                if (it.hasNext()) str.append(",");
            }
            str.append("]");


          //Close connection and return response
            conn.close();
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
  //** getCategoryID
  //**************************************************************************
    private Long getCategoryID(String description, JSONObject rule){
        String filter = rule.get("filter").toString();
        String keyword = rule.get("keyword").toString();
        Long categoryID = rule.get("categoryID").toLong();
        if (filter==null || keyword==null || categoryID==null) return null;

        filter = filter.toLowerCase();
        keyword = keyword.toLowerCase();
        description = description.toLowerCase();
        while (description.contains("  ")){
            description = description.replace("  ", " ").trim();
        }


        if (filter.equals("equals")){
            if (description.equals(keyword)) return categoryID;
        }
        else if (filter.equals("contains")){
            if (description.contains(keyword)) return categoryID;
        }
        else if (filter.equals("starts with")){
            if (description.startsWith(keyword)) return categoryID;
        }
        else if (filter.equals("ends with")){
            if (description.endsWith(keyword)) return categoryID;
        }
        return null;
    }

}