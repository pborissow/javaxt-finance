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

import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.select.*;
import net.sf.jsqlparser.expression.operators.relational.*;
import net.sf.jsqlparser.util.deparser.*;


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
                    addModel(c);
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
    public ServiceResponse getServiceResponse(ServiceRequest request)
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
  //** getRecordset
  //**************************************************************************
  /** Used to apply custom filters
   */
    protected Recordset getRecordset(ServiceRequest request, String op, Class c,
        String sql, Connection conn) throws Exception {

        if (c.equals(Transaction.class)){
            if (op.equals("list")){
                String q = request.getParameter("q").toString();
                if (q!=null && !q.isBlank()){


                    Select select = (Select) CCJSqlParserUtil.parse(sql);
                    PlainSelect plainSelect = (PlainSelect) select.getSelectBody();

                    StringBuilder buffer = new StringBuilder();
                    SelectDeParser selectDeParser = new SelectDeParser();
                    selectDeParser.setExpressionVisitor(new ExpressionDeParser(null, buffer) {
                        public void visit(EqualsTo equalsTo) {

                            if (equalsTo.getLeftExpression().toString().equalsIgnoreCase("q")){

                                String q = request.getParameter("q").toString().toLowerCase();
                                try{
                                    LikeExpression like = (LikeExpression) CCJSqlParserUtil.parseCondExpression(
                                    "lower(description) like '" + q + "%'");
                                    super.visit(like);
                                }
                                catch(Exception e){
                                    super.visit(equalsTo);
                                }
                            }
                            else{
                                super.visit(equalsTo);
                            }
                        }
                    });
                    selectDeParser.setBuffer(buffer);
                    plainSelect.accept(selectDeParser);

                    sql = buffer.toString();
                    System.out.println(sql);

                }
                request.setParameter("q", null);
            }
        }

        return super.getRecordset(request, op, c, sql, conn);
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

        try (Connection conn = database.getConnection()){
            conn.execute("update transaction set category_id=" + categoryID + " where id="+id);
            return new ServiceResponse(200);
        }
        catch(Exception e){
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

        try (Connection conn = database.getConnection()){


          //Fetch valid category IDs
            HashSet<Long> categoryIDs = new HashSet<>();
            for (javaxt.sql.Record record : conn.getRecords("select id from category")){
                categoryIDs.add(record.get(0).toLong());
            }


          //Fetch active rules
            ArrayList<JSONObject> rules = new ArrayList<>();
            for (javaxt.sql.Record record : conn.getRecords("select info from rule where active=true order by name desc")){
                JSONObject rule = new JSONObject(record.get(0).toString());
                Long categoryID = rule.get("categoryID").toLong();
                if (categoryID!=null){
                    if (categoryIDs.contains(categoryID)) rules.add(rule);
                }
            }


          //Match rules to transactions
            HashMap<Long, Long> updates = new HashMap<>();
            for (javaxt.sql.Record record : conn.getRecords(
            "select transaction.id, description, source.account_id " +
            "from transaction join source on transaction.source_id=source.id " +
            "where category_id is null")){

                long id = record.get("id").toLong();
                String description = record.get("description").toString();
                long sourceAccountID = record.get("account_id").toLong();
                for (JSONObject rule : rules){
                    Long categoryID = getCategoryID(rule, sourceAccountID, description);
                    if (categoryID!=null){
                        updates.put(id, categoryID);
                        break;
                    }
                }
            }


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
            ServiceResponse response = new ServiceResponse(str.toString());
            response.setContentType("application/json");
            return response;
        }
        catch(Exception e){
            return new ServiceResponse(e);
        }
    }


  //**************************************************************************
  //** getCategoryID
  //**************************************************************************
    private Long getCategoryID(JSONObject rule, long sourceAccountID, String description){

      //Get rule details
        String filter = rule.get("filter").toString();
        String keyword = rule.get("keyword").toString();
        Long categoryID = rule.get("categoryID").toLong();
        Long sourceFilter = rule.get("sourceAccountID").toLong();


      //Exit early if we can
        if (filter==null || keyword==null || categoryID==null) return null;
        if (sourceFilter!=null) if (sourceAccountID!=sourceFilter) return null;


      //Update params
        filter = filter.toLowerCase();
        keyword = keyword.toLowerCase();
        description = description.toLowerCase();
        while (description.contains("  ")){
            description = description.replace("  ", " ").trim();
        }


      //Return category
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