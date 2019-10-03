package javaxt.express.finance.web;
import javaxt.express.finance.*;

import javaxt.io.Jar;
import javaxt.io.Directory;
import javaxt.sql.*;
import javaxt.json.*;

import javaxt.express.ws.*;
import javaxt.http.servlet.*;

import java.util.*;
import java.io.IOException;
import java.math.BigDecimal;
import javaxt.express.utils.CSV;



import javax.script.*;
import jdk.nashorn.api.scripting.ScriptObjectMirror;


public class WebServices extends WebService {

    private Database database;
    private Directory downloadDir;

  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public WebServices(Database database, Directory downloadDir) throws Exception {
        this.database = database;
        this.downloadDir = downloadDir;

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
                //"WWW-Authenticate", "Basic realm=\"Access Denied\""
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


//      //Authenticate request
//        try{
//            request.authenticate();
//        }
//        catch(Exception e){
//            return new ServiceResponse(403, "Not Authorized");
//        }


        String service = request.getPath(0).toString();
        if (service.equalsIgnoreCase("transactions")){

          //Normally, post requests are mapped to a "save" action but in
          //this case we want to upload data instead
            if (request.getRequest().getMethod().equals("POST")){
                return upload(request);
            }
            else{
                return getServiceResponse(request, database);
            }
        }
        else if (service.equalsIgnoreCase("linkTransaction")){
            return linkTransaction(request);
        }
        else if (service.equalsIgnoreCase("download")){

          //demo only?
            String relPath = request.getPath().substring("/download".length());
            if (relPath.startsWith("/")) relPath = relPath.substring(1);
            if (!relPath.contains("./")){
                java.io.File file = new java.io.File(downloadDir + relPath);
                if (file.exists() && !file.isDirectory()){
                    return new ServiceResponse(new javaxt.io.File(file));
                }
            }
            return new ServiceResponse(404);
        }
        else if (service.equals("reports")){
            return new ServiceResponse(501, "Not Implemented");
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
  //** upload
  //**************************************************************************
  /** Used to import transactions uploaded via the "transactions" endpoint
   */
    private ServiceResponse upload(ServiceRequest request)
        throws ServletException {

        try{
            JSONObject json = request.getJson();
            long sourceID = json.get("source").toLong();
            Source source = new Source(sourceID);
            JSONObject template = source.getInfo().get("template").toJSONObject();
            int startRow = template.has("startRow") ? template.get("startRow").toInteger() : 0;
            Boolean containsHeader = template.get("containsHeader").toBoolean();
            if (containsHeader==null) containsHeader = false;
            String columnParser = template.get("columnParser").toString();
            String dateFormat = template.get("dateFormat").toString();
            int dateColumn = template.get("dateColumn").toInteger();
            int descColumn = template.get("descColumn").toInteger();
            int debitColumn = template.get("debitColumn").toInteger();
            int creditColumn = template.get("creditColumn").toInteger();


            int offset = startRow;
            if (offset<1) offset = 0;
            else offset = offset-1;
            if (containsHeader) offset++;


            ScriptObjectMirror parser = null;
            if (columnParser!=null){
                ScriptEngineManager factory = new ScriptEngineManager();
                ScriptEngine engine = factory.getEngineByName("nashorn");
                Compilable compilable = (Compilable) engine;
                CompiledScript script = compilable.compile(columnParser);
                Bindings bindings = engine.createBindings();
                script.eval(bindings);
                parser = (ScriptObjectMirror) bindings.get("parseColumns");
            }



            String[] data = json.get("data").toString().split("\n");
            for (int i=offset; i<data.length; i++){
                String row = data[i];
                if (row.endsWith("\r")) row = row.substring(0, row.length()-1);
                if (row.isEmpty()) continue;


                CSV.Columns columns = CSV.getColumns(row, ",");



                if (parser!=null){

                  //Convert the columns to a string array
                    String[] cols = new String[columns.length()];
                    for (int j=0; j<cols.length; j++){
                        cols[j] = columns.get(j).toString();
                    }


                  //Execute script
                    ScriptObjectMirror output = (ScriptObjectMirror) parser.call(null, Arrays.asList(cols));
                    Object[] arr = output.to(Object[].class);


                  //Update columns
                    columns = new CSV.Columns();
                    for (Object obj : arr){
                        columns.add(new Value(obj));
                    }
                }




                String dateVal = columns.get(dateColumn).toString().trim();
                while (dateVal.contains("  ")) dateVal = dateVal.replace("  ", " ");
                javaxt.utils.Date date;
                if (dateFormat==null) date = new javaxt.utils.Date(dateVal);
                else date = new javaxt.utils.Date(dateVal, dateFormat);

                String desc = columns.get(descColumn).toString();
                if (desc.startsWith("\"") && desc.endsWith("\"")){
                    desc = desc.substring(1, desc.length()-1);
                }

                BigDecimal amount;
                if (debitColumn==creditColumn){
                    amount = columns.get(debitColumn).toBigDecimal();
                }
                else{
                    String debit = columns.get(debitColumn).toString();
                    String credit = columns.get(creditColumn).toString();

                    if (debit==null) debit = ""; else debit = debit.trim();
                    if (credit==null) credit = ""; else credit = credit.trim();

                    if (debit.length()>0){
                        amount = new BigDecimal(debit);
                        if (amount.compareTo(BigDecimal.ZERO) > 0) amount = amount.negate();
                    }
                    else{
                        amount = new BigDecimal(credit);
                    }
                }

                Transaction tx = new Transaction();
                tx.setSource(source);
                tx.setDate(date);
                tx.setDescription(desc);
                tx.setAmount(amount);
                tx.save();
            }

            return new ServiceResponse(200);
        }
        catch(Exception e){
            return new ServiceResponse(e);
        }


    }




}