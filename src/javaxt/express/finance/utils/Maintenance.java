package javaxt.express.finance.utils;
import javaxt.express.utils.DbUtils;
import javaxt.express.finance.*;

import javaxt.sql.*;
import javaxt.json.*;
import javaxt.utils.Console;
import javaxt.utils.ThreadPool;

import java.util.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;


//******************************************************************************
//**  Maintenance Class
//******************************************************************************
/**
 *   Provides static methods used to fix/update records in the database
 *
 ******************************************************************************/

public class Maintenance {

  //**************************************************************************
  //** updateSources
  //**************************************************************************
  /** Used to update SourceAccount associated with Transactions. A CSV file
   *  is used to identify transactions
   */
    public static void updateSources(String csvFile, Database database) throws Exception {

        javaxt.io.File file = new javaxt.io.File(csvFile);
        String[] data = file.getText().split("\n");
        Connection conn = null;
        javaxt.express.finance.utils.Parser parser = null;
        Long vendorID = null;
        SourceAccount account = null;
        SourceTemplate template = null;


      //Get template
        StringBuilder options = new StringBuilder(
            "\r\n"+
            "------------------------------------------\r\n"+
            " Please select a template:\r\n"+
            "------------------------------------------\r\n"
        );
        int x = 1;
        HashMap<Integer, Integer> map = new HashMap<>();
        try{
            conn = database.getConnection();
            for (Recordset rs: conn.getRecordset("select id, name from source_template order by name")){
                Integer id = rs.getValue("id").toInteger();
                String name = rs.getValue("name").toString();
                options.append("  " + x + ". " + name + "\r\n");
                map.put(x, id);
                x++;
            }
            conn.close();
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            throw e;
        }

        System.out.print(options);
        while (true){
            System.out.print("\r\n> ");
            BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
            try {
                int n = Integer.parseInt(br.readLine());
                if (n<1 || n>x) throw new NumberFormatException();

                template = new SourceTemplate(map.get(n));
                vendorID = template.getVendor().getID();
                parser = new javaxt.express.finance.utils.Parser(template);
                break;
            }
            catch(NumberFormatException e){
                System.out.println("  ERROR: Invalid Entry!");
            }
            catch (Exception e) {
                e.printStackTrace();
                System.exit(1);
            }
        }


      //Select source account
        options = new StringBuilder(
            "\r\n"+
            "------------------------------------------\r\n"+
            " Please select an account:\r\n"+
            "------------------------------------------\r\n"
        );
        x = 1;
        map = new HashMap<>();
        try{
            conn = database.getConnection();
            for (Recordset rs: conn.getRecordset("select id, account_name from source_account where vendor_id=" + vendorID + " order by account_name")){
                Integer id = rs.getValue("id").toInteger();
                String name = rs.getValue("account_name").toString();
                options.append("  " + x + ". " + name + "\r\n");
                map.put(x, id);
                x++;
            }
            conn.close();
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            throw e;
        }

        System.out.print(options);
        while (true){
            System.out.print("\r\n> ");
            BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
            try {
                int n = Integer.parseInt(br.readLine());
                if (n<1 || n>x) throw new NumberFormatException();

                account = new SourceAccount(map.get(n));
                break;
            }
            catch(NumberFormatException e){
                System.out.println("  ERROR: Invalid Entry!");
            }
            catch (Exception e) {
                e.printStackTrace();
                System.exit(1);
            }
        }


      //Get or create source
        Source source = Source.get("account_id=", account.getID(), "template_id=", template.getID());
        if (source==null){
            source = new Source();
            source.setAccount(account);
            source.setTemplate(template);
            source.save();
        }


      //Parse file and update transactions
        int numUpdates = 0;
        int total = 0;
        for (Transaction transaction : parser.getTransactions(data)){
            Transaction tx = Transaction.get("raw_data=", transaction.getRawData());
            if (tx!=null){
                tx.setSource(source);
                tx.save();
                numUpdates++;
            }
            total++;
        }

        System.out.println("Successfully updated " + numUpdates + "/" + total + " transactions");
    }


  //**************************************************************************
  //** importSources
  //**************************************************************************
  /** Used to import data from an older database design into a newer one.
   *  @param dbFile old database
   *  @param database new database
   */
    public static void importSources(javaxt.io.File dbFile, Database database) throws Exception {
        System.out.println(database.getHost());

        Database sourceDB = database.clone();
        String host = dbFile.getDirectory() + dbFile.getName(false);
        if (host.endsWith(".mv")) host = host.substring(0, host.length()-3);
        sourceDB.setHost(host.replace("\\", "/"));
        System.out.println(sourceDB.getHost());


        DbUtils.copyTable("account", null, sourceDB, database, 1000, 1);
        DbUtils.copyTable("category", null, sourceDB, database, 1000, 1);
        DbUtils.copyTable("rule", null, sourceDB, database, 1000, 1);


        Connection conn = null;
        try{
            conn = sourceDB.getConnection();


            HashMap<Long, Source> sources = new HashMap<>();
            for (Recordset rs : conn.getRecordset("select id, name, info from source")){
                long sourceID = rs.getValue("id").toLong();
                String name = rs.getValue("name").toString().trim();
                JSONObject template = new JSONObject(rs.getValue("info").toString()).get("template").toJSONObject();

                String vendorName = name;
                if (vendorName.endsWith("2")) vendorName = vendorName.substring(0, vendorName.length()-1).trim();
                System.out.println(name + " -> " + vendorName);

                Vendor vendor = Vendor.get("name=", vendorName);
                if (vendor==null){
                    vendor = new Vendor();
                    vendor.setName(vendorName);
                    vendor.setActive(true);
                    vendor.save();
                }


                SourceAccount sourceAccount = SourceAccount.get("account_name=", vendorName);
                if (sourceAccount==null){
                    sourceAccount = new SourceAccount();
                    sourceAccount.setVendor(vendor);
                    sourceAccount.setAccountName(vendorName);
                    sourceAccount.setActive(true);
                    sourceAccount.save();
                }

                SourceTemplate sourceTemplate = new SourceTemplate();
                sourceTemplate.setVendor(vendor);
                sourceTemplate.setName(name);
                sourceTemplate.setActive(true);
                sourceTemplate.setInfo(template);
                sourceTemplate.save();


                Source source = Source.get("account_id=", sourceAccount.getID(), "template_id=", sourceTemplate.getID());
                if (source==null){
                    source = new Source();
                    source.setAccount(sourceAccount);
                    source.setTemplate(sourceTemplate);
                    source.save();
                }
                sources.put(sourceID, source);
            }



            for (Recordset rs : conn.getRecordset("select * from transaction")){
                JSONObject json = DbUtils.getJson(rs);
                Long sourceID = json.get("sourceID").toLong();
                Source source = sources.get(sourceID);
                json.set("sourceID", null);

                Transaction tx = new Transaction(json);
                tx.setSource(source);
                tx.save();
            }

            conn.close();
        }
        catch(Exception e){
            if (conn!=null) conn.close();
            e.printStackTrace();
        }


    }

}