package javaxt.express.finance;
import javaxt.json.*;
import java.sql.SQLException;


//******************************************************************************
//**  Source Class
//******************************************************************************
/**
 *   Used to represent a Source
 *
 ******************************************************************************/

public class Source extends javaxt.sql.Model {

    private SourceAccount account;
    private SourceTemplate template;


  //**************************************************************************
  //** Constructor
  //**************************************************************************
    public Source(){
        super("source", new java.util.HashMap<String, String>() {{
            
            put("account", "account_id");
            put("template", "template_id");

        }});
        
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a record ID in the database.
   */
    public Source(long id) throws SQLException {
        this();
        init(id);
    }


  //**************************************************************************
  //** Constructor
  //**************************************************************************
  /** Creates a new instance of this class using a JSON representation of a
   *  Source.
   */
    public Source(JSONObject json){
        this();
        update(json);
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update attributes using a record in the database.
   */
    protected void update(Object rs) throws SQLException {

        try{
            this.id = getValue(rs, "id").toLong();
            Long accountID = getValue(rs, "account_id").toLong();
            Long templateID = getValue(rs, "template_id").toLong();



          //Set account
            if (accountID!=null) account = new SourceAccount(accountID);


          //Set template
            if (templateID!=null) template = new SourceTemplate(templateID);

        }
        catch(Exception e){
            if (e instanceof SQLException) throw (SQLException) e;
            else throw new SQLException(e.getMessage());
        }
    }


  //**************************************************************************
  //** update
  //**************************************************************************
  /** Used to update attributes with attributes from another Source.
   */
    public void update(JSONObject json){

        Long id = json.get("id").toLong();
        if (id!=null && id>0) this.id = id;
        if (json.has("account")){
            account = new SourceAccount(json.get("account").toJSONObject());
        }
        else if (json.has("accountID")){
            try{
                account = new SourceAccount(json.get("accountID").toLong());
            }
            catch(Exception e){}
        }
        if (json.has("template")){
            template = new SourceTemplate(json.get("template").toJSONObject());
        }
        else if (json.has("templateID")){
            try{
                template = new SourceTemplate(json.get("templateID").toLong());
            }
            catch(Exception e){}
        }
    }


    public SourceAccount getAccount(){
        return account;
    }

    public void setAccount(SourceAccount account){
        this.account = account;
    }

    public SourceTemplate getTemplate(){
        return template;
    }

    public void setTemplate(SourceTemplate template){
        this.template = template;
    }
    
    


  //**************************************************************************
  //** get
  //**************************************************************************
  /** Used to find a Source using a given set of constraints. Example:
   *  Source obj = Source.get("account_id=", account_id);
   */
    public static Source get(Object...args) throws SQLException {
        Object obj = _get(Source.class, args);
        return obj==null ? null : (Source) obj;
    }


  //**************************************************************************
  //** find
  //**************************************************************************
  /** Used to find Sources using a given set of constraints.
   */
    public static Source[] find(Object...args) throws SQLException {
        Object[] obj = _find(Source.class, args);
        Source[] arr = new Source[obj.length];
        for (int i=0; i<arr.length; i++){
            arr[i] = (Source) obj[i];
        }
        return arr;
    }
}