package javaxt.express.finance.utils;
import javaxt.express.utils.DbUtils;
import javaxt.express.finance.*;

import javaxt.sql.*;
import javaxt.json.*;
import static javaxt.utils.Console.console;

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

    public static void parseArgs(String[] inputs, Database database) throws Exception {
        HashMap<String, String> args = console.parseArgs(inputs);

        String script = args.get("-maintenance");

        if (script.equalsIgnoreCase("deleteDuplicates")){
            deleteDuplicates(database);
        }
        else if (script.equalsIgnoreCase("updateSources")){
            updateSources(inputs[inputs.length-1], database);
        }

    }


  //**************************************************************************
  //** deleteDuplicates
  //**************************************************************************
  /** Used to identify potentially duplicate transactions and provides the
   *  option to delete the duplicates.
   */
    public static void deleteDuplicates(Database database) throws Exception {

        var threshold = 25; //min distance between transaction IDs

        System.out.println("Running report with distance threshold set to " + threshold + "...\n");

        HashSet<Integer> suggestions = new HashSet<>();
        var duplicates = new HashMap<Integer, Integer>();
        try (Connection conn = database.getConnection()){

            //ALTER TABLE TRANSACTION ADD UNIQUE (DATE, SOURCE_ID, AMOUNT, DESCRIPTION);


            var query =
            "select TRANSACTION.ID, DATE, ACCOUNT_ID, AMOUNT, DESCRIPTION, RAW_DATA " +
            "from TRANSACTION JOIN SOURCE ON TRANSACTION.SOURCE_ID=SOURCE.ID " +
            "ORDER BY TRANSACTION.ID";


            var uniqueTransactions = new HashMap<String, Integer>();
            var raw = new HashMap<Integer, String>();
            var groupID = 0;

            for (Record record : conn.getRecords(query)){
                var id = record.get("id").toInteger();
                var date = record.get("date").toDate();
                var sourceID = record.get("account_id").toString();
                var amount = record.get("amount").toString();
                var description = record.get("description").toString();
                var transaction = ("|"+date.toString("yyyy-MM-dd")+"|"+sourceID+"|"+amount+"|"+description+"|").toUpperCase();

                raw.put(id, record.get("RAW_DATA").toString());

                if (uniqueTransactions.containsKey(transaction)){
                    int dupID = uniqueTransactions.get(transaction);
                    int d = Math.abs(id-dupID);
                    boolean del = d>threshold;

                    groupID++;
                    System.out.println("(" + groupID + ")");
                    System.out.println("\t" + dupID + transaction + "[" + raw.get(dupID) + "]");
                    System.out.println("\t" + id + transaction + "[" + record.get("RAW_DATA") + "]" + (del ? "<----del" : ""));
                    System.out.println();

                    duplicates.put(groupID, id);

                    if (del){
                        suggestions.add(id);
                    }
                }
                else{
                    uniqueTransactions.put(transaction, id);
                }

            }
        }

        System.out.print("Found " + duplicates.size() + " similar transactions. ");

        if (suggestions.isEmpty()){
            System.out.println("However, the transaction IDs are so close that " +
            "they probably aren't duplicates. Compare the raw description to " +
            "determine whether you really have any duplicate.");
            /*
            Boolean answer = new Value(console.getInput(
            "\nIs there a specific transaction you would like to delete? [Y/n] ")).toBoolean();
            if (answer==null || answer==false) return;
            */
        }
        else{
            System.out.println("Found " + suggestions.size() + " potential duplicates.");
            Boolean answer = new Value(console.getInput(
            "\nDo you want to delete these records? [Y/n] ")).toBoolean();
            if (answer==null || answer==false) return;


            try (Connection conn = database.getConnection()){
                for (Integer id : suggestions){
                    conn.execute("delete from transaction where id=" + id);
                }
            }

            System.out.println("Successfully deleted " + suggestions.size() + " duplicates.");
        }
    }


  //**************************************************************************
  //** updateSources
  //**************************************************************************
  /** Used to update SourceAccount associated with Transactions. A CSV file
   *  is used to identify transactions
   */
    public static void updateSources(String csvFile, Database database) throws Exception {

        javaxt.io.File file = new javaxt.io.File(csvFile);
        String[] data = file.getText().split("\n");

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
        try (Connection conn = database.getConnection()){
            for (javaxt.sql.Record record : conn.getRecords(
            "select id, name from source_template order by name")){
                Integer id = record.get("id").toInteger();
                String name = record.get("name").toString();
                options.append("  " + x + ". " + name + "\r\n");
                map.put(x, id);
                x++;
            }
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
        try (Connection conn = database.getConnection()){
            for (javaxt.sql.Record record : conn.getRecords(
            "select id, account_name from source_account where vendor_id=" + vendorID +
            " order by account_name")){
                Integer id = record.get("id").toInteger();
                String name = record.get("account_name").toString();
                options.append("  " + x + ". " + name + "\r\n");
                map.put(x, id);
                x++;
            }
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


        try (Connection conn = database.getConnection()){


            HashMap<Long, Source> sources = new HashMap<>();
            for (javaxt.sql.Record record : conn.getRecords("select id, name, info from source")){
                long sourceID = record.get("id").toLong();
                String name = record.get("name").toString().trim();
                JSONObject template = new JSONObject(record.get("info").toString()).get("template").toJSONObject();

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



            for (javaxt.sql.Record record : conn.getRecords("select * from transaction")){
                JSONObject json = DbUtils.getJson(record);
                Long sourceID = json.get("sourceID").toLong();
                Source source = sources.get(sourceID);
                json.set("sourceID", null);

                Transaction tx = new Transaction(json);
                tx.setSource(source);
                tx.save();
            }

        }
        catch(Exception e){
            e.printStackTrace();
        }
    }

}