/* See license.txt for terms of usage */
/**
 * This file implements DB related operations
 * Currently, we maintain those DB tables:
 *
 * ---------- always in use except that the user chooses not to remember any historical info
 * - loginactual: actual login (handled by piigeon.insertLoginactual())
 * - prediction: historical actual login that can be used to predict future logins (handled by piigeon.updatePrediction())
 *
 * ---------- used in measurement mode (when extensions.piigeon.dev is turned on)
 * - logindetected: predicted login (handled by piigeon.dbController.insertLogindetected())
 * - comparison: a comparison of predicted and actual login (handled by piigeon.dbController.insertComparison())
 *
 * ---------- location (won't be sent out):
 * - wireless: mac address, name, ssid of an AP and a nearby AP with the strongest signal
 * - wirelessuser: how user labels a location (e.g., home, work, airport)
 * - locationcache: map mac addresses to physical addresses by geolocation API
 *
 * ---------- cached data that'll be sent to our sever:
 * - server_temp_login: an anonymized login (site url, action url, encryption, etc. with identifiers filtered out)
 * - server_temp_record: date (whether the user uses Piigeon on that day)
 * - server_temp_evaluation: anonymized data used for evaluating Piigeon
 */

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;

if (!piigeon) {
    var piigeon = {};
}

// This is a controller that handles local sqlite DB
piigeon.dbController = {
    dbFilename: "piigeon.sqlite",
    dbConn: null,
    
    // This handles different versions of Piigeon to make sure that it is compatible even the user switched versions
    handleVersion: function(){
        // create database
        var storageService = Components.classes["@mozilla.org/storage/service;1"]
            .getService(Ci.mozIStorageService);
        var dbFile = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        
        dbFile.append(this.dbFilename);
        this.dbConn = storageService.openDatabase(dbFile);
        
        // in 1.0 version
        try {
            var statement = this.dbConn.createStatement("DROP TABLE login IF EXISTS");
            executeStatement(statement);
            statement = this.dbConn.createStatement("VACUUM");
            executeStatement(statement);
        } 
        catch (e) {
        }
        
        // An older (non-public) version of Piigeon could use different tables which'll make
        // the current version not work. We check the statements here and drop the old DB if
        // it isn't compatible with the current one.
        var check = false;
        try {
            this.insertLoginactualStatement = this.dbConn.createStatement(
                "INSERT INTO loginactual(site, siteUrl, actionUrl, enc, time, wireless) VALUES(?1, ?2, ?3, ?4, ?5, ?6)");
        } 
        catch (e) {
            var statement = this.dbConn.createStatement(
                "DROP TABLE loginactual IF EXISTS");
            executeStatement(statement);
            check = true;
        }
        try {
            this.insertLogindetectedStatement = this.dbConn.createStatement(
                "INSERT INTO logindetected(site, siteUrl, actionUrl, enc, time) VALUES(?1, ?2, ?3, ?4, ?5)");
        } 
        catch (e) {
            var statement = this.dbConn.createStatement(
                "DROP TABLE logindetected IF EXISTS");
            executeStatement(statement);
            check = true;
        }
        try {
            this.insertPredictionStatement = this.dbConn.createStatement(
                "INSERT INTO prediction(site, siteUrl, actionUrl, enc, time) VALUES(?1, ?2, ?3, ?4, ?5)");
        } 
        catch (e) {
            var statement = this.dbConn.createStatement(
                "DROP TABLE prediction IF EXISTS");
            executeStatement(statement);
            check = true;
        }
        try {
            this.insertComparisonStatement = this.dbConn.createStatement(
                "INSERT INTO comparison(" +
                    "site, siteUrl, actionUrl, enc, timep, host, httpUrl, https, dir, mech, timem, correct, reserved" +
                    ") VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)");
            
        } 
        catch (e) {
            var statement = this.dbConn.createStatement(
                "DROP TABLE comparison IF EXISTS");
            executeStatement(statement);
            check = true;
        }
        try {
            this.insertWirelessStatement = this.dbConn.createStatement(
                "INSERT INTO wireless(id, max, maxmac, ssid, mac, ss, time) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)");
        } 
        catch (e) {
            var statement = this.dbConn.createStatement(
                "DROP TABLE wireless IF EXISTS");
            executeStatement(statement);
            check = true;
        }
        try {
            this.insertWirelessUserStatement = this.dbConn.createStatement(
                "INSERT INTO wirelessuser(mac, location, time) VALUES(?1, ?2, ?3)");
        } 
        catch (e) {
            var statement = this.dbConn.createStatement(
                "DROP TABLE wirelessuser IF EXISTS");
            executeStatement(statement);
            check = true;
        }
        
        if (check) {
            this.init();
        }
    },
    
    // Initialize DB. This includes connecting to the DB, creating tables that don't exist,
    // and preparing statements that could be used in the future.
    init: function(){
        // create database
        var storageService = Components.classes["@mozilla.org/storage/service;1"]
                    .getService(Ci.mozIStorageService);
        var dbFile = Components.classes["@mozilla.org/file/directory_service;1"]
                    .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
        
        dbFile.append(this.dbFilename);
        this.dbConn = storageService.openDatabase(dbFile);
        
        // create table "loginactual" that stores information about actual logins
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS loginactual (' +
        'site VARCHAR(50),' +
        'siteUrl VARCHAR(500),' +
        'actionUrl VARCHAR(500),' +
        'enc VARCHAR(5),' +
        'time VARCHAR(100),' +
        'wireless VARCHAR(500)' +
        ');');
        executeStatement(statement);
        
        // create table "prediction" that stores information used to predict logins using historical info
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS prediction (' +
        'site VARCHAR(50),' +
        'siteUrl VARCHAR(500),' +
        'actionUrl VARCHAR(500),' +
        'enc VARCHAR(5),' +
        'time VARCHAR(100)' +
        ');');
        executeStatement(statement);
        
        // create table "logindetected" that stores information about detected logins
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS logindetected (' +
        'site VARCHAR(50),' +
        'siteUrl VARCHAR(500),' +
        'actionUrl VARCHAR(500),' +
        'enc VARCHAR(5),' +
        'time VARCHAR(100)' +
        ');');
        executeStatement(statement);
        
        // create table "comparison"
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS comparison (' +
        'site VARCHAR(50),' +
        'siteUrl VARCHAR(500),' +
        'actionUrl VARCHAR(500),' +
        'enc VARCHAR(5),' +
        'timep VARCHAR(100),' +
        'host VARCHAR(50),' +
        'httpUrl VARCHAR(500),' +
        'https VARCHAR(5),' +
        'dir VARCHAR(5),' +
        'mech VARCHAR(50),' +
        'timem VARCHAR(100),' +
        'correct VARCHAR(5),' +
        'reserved VARCHAR(500)' +
        ');');
        executeStatement(statement);
        
        ///////////////////////////////
        // Those tables are used to track user locations which could be shown in Piigeon report
        // Note that they are just stored in the DB and won't be sent out (e.g., to our server)
        // create table "locationcache" that stores information about detected logins
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS locationcache (' +
        'latitude VARCHAR(10),' +
        'longitude VARCHAR(10),' +
        'address VARCHAR(50)' +
        ');');
        
        executeStatement(statement);
        // create table "wireless"
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS wireless (' +
        'id INTEGER(10),' +
        'max VARCHAR(50),' +
        'maxmac VARCHAR(50),' +
        'ssid VARCHAR(50),' +
        'mac VARCHAR(50),' +
        'ss INTEGER(10),' +
        'time VARCHAR(100)' +
        ');');
        executeStatement(statement);
        
        // create table "wirelessuser"
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS wirelessuser (' +
        'mac VARCHAR(50),' +
        'location VARCHAR(10),' +
        'time VARCHAR(100)' +
        ');');
        executeStatement(statement);
        
        ///////////////////////////////
        // These tables are just used as cache that store data which will be sent to our server
        // create table "server_temp_login"
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS server_temp_login (' +
        'site VARCHAR(50),' +
        'page VARCHAR(500),' +
        'action VARCHAR(500),' +
        'actionp VARCHAR(500),' +
        'referrer VARCHAR(500),' +
        'mechanism VARCHAR(50),' +
        'passenc VARCHAR(5),' +
        'pageenc VARCHAR(5),' +
        'cookies VARCHAR(500),' +
        'reserved VARCHAR(500)' +
        ');');
        executeStatement(statement);

        // create table "server_temp_record"
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS server_temp_record (' +
        'loginlast VARCHAR(50),' +
        'reserved VARCHAR(500)' +
        ');');
        executeStatement(statement);

        // create table "server_temp_evaluation"
        var statement = this.dbConn.createStatement('CREATE TABLE IF NOT EXISTS server_temp_evaluation (' +
        'type VARCHAR(50),' +
        'url VARCHAR(500),' +
        'data VARCHAR(10000),' +
        'reserved VARCHAR(500)' +
        ');');
        executeStatement(statement);
        
        /*// Speed up, but lose reliability
        statement = this.dbConn.createStatement('PRAGMA synchronous=OFF');
        executeStatement(statement);*/
        
        //////////////////////////////
        // Prepares DB statements
        
        // Table "loginactual"
        this.insertLoginactualStatement = this.dbConn.createStatement(
            "INSERT INTO loginactual(site, siteUrl, actionUrl, enc, time, wireless) VALUES(?1, ?2, ?3, ?4, ?5, ?6)");
        this.selectLoginSiteStatement = this.dbConn.createStatement(
            "SELECT distinct site FROM loginactual");
        this.selectLoginUrlStatement = this.dbConn.createStatement(
            "SELECT siteUrl, enc FROM loginactual WHERE site = ?1");
        this.selectLoginVisitsStatement = this.dbConn.createStatement(
            "SELECT * FROM loginactual WHERE site = ?1 AND siteUrl = ?2");
        this.selectLoginVisitsSiteStatement = this.dbConn.createStatement(
            "SELECT * FROM loginactual WHERE site = ?1");
        this.selectLoginVisitsUrlStatement = this.dbConn.createStatement(
            "SELECT * FROM loginactual WHERE siteUrl = ?1  AND enc = ?2");
        this.deleteLoginItemAllStatement = this.dbConn.createStatement(
            "DELETE FROM loginactual");
        this.deleteLoginItemSiteStatement = this.dbConn.createStatement(
            "DELETE FROM loginactual WHERE site = ?1");
        this.deleteLoginItemUrlStatement = this.dbConn.createStatement(
            "DELETE FROM loginactual WHERE siteUrl = ?1 AND enc = ?2");
        this.deleteLoginactualTimeStatement = this.dbConn.createStatement(
            "DELETE FROM loginactual WHERE time = ?1");
        
        // Table "prediction"
        this.insertPredictionStatement = this.dbConn.createStatement(
            "INSERT INTO prediction(site, siteUrl, actionUrl, enc, time) VALUES(?1, ?2, ?3, ?4, ?5)");
        this.selectPredictionStatement = this.dbConn.createStatement(
            "SELECT * FROM prediction WHERE siteUrl = ?1");
        this.deletePredictionStatement = this.dbConn.createStatement(
            "DELETE FROM prediction WHERE siteUrl = ?1 AND actionUrl = ?2");
        this.deletePredictionTimeStatement = this.dbConn.createStatement(
            "DELETE FROM prediction WHERE time = ?1");
            
        // Table "logindetected"
        this.insertLogindetectedStatement = this.dbConn.createStatement(
            "INSERT INTO logindetected(site, siteUrl, actionUrl, enc, time) VALUES(?1, ?2, ?3, ?4, ?5)");
        this.deleteLogindetectedTimeStatement = this.dbConn.createStatement(
            "DELETE FROM logindetected WHERE time = ?1");
        this.deleteLogindetectedStatement = this.dbConn.createStatement(
            "DELETE FROM logindetected WHERE site = ?1 AND actionUrl = ?2 AND enc = ?3");
        
        // Table "comparison"
        this.insertComparisonStatement = this.dbConn.createStatement(
            "INSERT INTO comparison(" +
                "site, siteUrl, actionUrl, enc, timep, host, httpUrl, https, dir, mech, timem, correct, reserved" +
                ") VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)");
        this.deleteComparisonTimeStatement = this.dbConn.createStatement(
            "DELETE FROM comparison WHERE timep = ?1");
        
        // Table "wireless"
        this.insertWirelessStatement = this.dbConn.createStatement(
            "INSERT INTO wireless(id, max, maxmac, ssid, mac, ss, time) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)");
        this.selectWirelessStatement = this.dbConn.createStatement(
            "SELECT * FROM wireless WHERE mac = ?1");
        this.selectWirelessFromMaxMacStatement = this.dbConn.createStatement(
            "SELECT distinct mac FROM wireless WHERE maxmac = ?1");
        
        // Table "wirelessuser"
        this.selectWirelessUserStatement = this.dbConn.createStatement(
            "SELECT * FROM wirelessuser WHERE mac = ?1");
		
        // Table "locationcache"
        this.insertLocationcacheStatement = this.dbConn.createStatement(
            "INSERT INTO locationcache(latitude, longitude, address) VALUES(?1, ?2, ?3)");
		this.selectLocationcacheStatement = this.dbConn.createStatement(
            "SELECT * FROM locationcache WHERE latitude = ?1 and longitude = ?2");
    
        // Table "server_temp_login"
        this.insertTempLoginStatement = this.dbConn.createStatement(
            "INSERT INTO server_temp_login(" +
                "site, page, action, actionp, referrer, mechanism, passenc, pageenc, cookies, reserved" +
                ") VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)");
        this.updateTempLoginStatement = this.dbConn.createStatement(
            "UPDATE server_temp_login SET reserved = ?1 WHERE site = ?2 AND page = ?3 AND action=?4 and referrer=?5");
        this.selectTempLoginStatement = this.dbConn.createStatement(
            "SELECT * FROM server_temp_login");
        this.selectTempLoginItemStatement = this.dbConn.createStatement(
            "SELECT * FROM server_temp_login WHERE site = ?1 AND page = ?2 AND action=?3 and referrer=?4");
        this.deleteTempLoginStatement = this.dbConn.createStatement(
            "DELETE FROM server_temp_login");
        this.deleteTempLogin1Statement = this.dbConn.createStatement(
            "DELETE FROM server_temp_login WHERE site = ?1 AND page = ?2 AND action=?3 and referrer=?4 AND reserved=?5");
        
        // Table "server_temp_record"
        this.insertTempRecordStatement = this.dbConn.createStatement(
            "INSERT INTO server_temp_record(loginlast, reserved) VALUES(?1, ?2)");
        this.selectTempRecordStatement = this.dbConn.createStatement(
            "SELECT * FROM server_temp_record");
        
        // Table "server_temp_evaluation"
        this.insertTempEvaluationStatement = this.dbConn.createStatement(
            "INSERT INTO server_temp_evaluation(type, url, data, reserved) VALUES(?1, ?2, ?3, ?4)");
        this.selectTempEvaluationStatement = this.dbConn.createStatement(
            "SELECT distinct type, url, data, reserved FROM server_temp_evaluation");
        this.deleteTempEvaluationStatement = this.dbConn.createStatement(
            "DELETE FROM server_temp_evaluation");
        
        return true;
    },
    
    ///////////////////////////////////
    // Table "loginactual"
    ///////////////////////////////////
    // Insert
    insertLoginactual: function(site, siteUrl, actionUrl, enc, time, wireless){
        this.insertLoginactualStatement.bindUTF8StringParameter(0, site);
        this.insertLoginactualStatement.bindUTF8StringParameter(1, siteUrl);
        this.insertLoginactualStatement.bindUTF8StringParameter(2, actionUrl);
        this.insertLoginactualStatement.bindUTF8StringParameter(3, enc);
        this.insertLoginactualStatement.bindUTF8StringParameter(4, time);
        this.insertLoginactualStatement.bindUTF8StringParameter(5, wireless);
        
        executeStatement(this.insertLoginactualStatement);
    },
    
    // Select distinct site
    selectLoginSite: function(){
        var sites = [];
        
        try {
            while (this.selectLoginSiteStatement.executeStep()) {
                sites.push(this.selectLoginSiteStatement.row.site);
            }
        }
        finally {
            this.selectLoginSiteStatement.reset();
        }
        
        return sites;
    },
    
    // Select url, encryption by site
    selectLoginUrl: function(site){
        var urls = [];
        this.selectLoginUrlStatement.bindUTF8StringParameter(0, site);
        try {
            while (this.selectLoginUrlStatement.executeStep()) {
                urls.push({
                    siteUrl: this.selectLoginUrlStatement.row.siteUrl,
                    enc: this.selectLoginUrlStatement.row.enc
                });
            }
        }
        finally {
            this.selectLoginUrlStatement.reset();
        }
        
        return urls;
    },
    
    // Select all by site and url
    selectLoginVisits: function(site, siteUrl){
        var visits = [];
        this.selectLoginVisitsStatement.bindUTF8StringParameter(0, site);
        this.selectLoginVisitsStatement.bindUTF8StringParameter(1, siteUrl);
        try {
            while (this.selectLoginVisitsStatement.executeStep()) {
                visits.push({
                    time: this.selectLoginVisitsStatement.row.time,
                    wireless: this.selectLoginVisitsStatement.row.wireless
                });
            }
        }
        finally {
            this.selectLoginVisitsStatement.reset();
        }
        
        return visits;
    },
    
    // Select all by site
    selectLoginVisitsSite: function(site){
        var visits = [];
        this.selectLoginVisitsSiteStatement.bindUTF8StringParameter(0, site);
        try {
            while (this.selectLoginVisitsSiteStatement.executeStep()) {
                visits.push({
                    time: this.selectLoginVisitsSiteStatement.row.time,
                    enc: this.selectLoginVisitsSiteStatement.row.enc,
                    wireless: this.selectLoginVisitsSiteStatement.row.wireless
                });
            }
        }
        finally {
            this.selectLoginVisitsSiteStatement.reset();
        }
        
        return visits;
    },
    
    // Select all by url and encryption
    selectLoginVisitsUrl: function(siteUrl, enc){
        var visits = [];
        this.selectLoginVisitsUrlStatement.bindUTF8StringParameter(0, siteUrl);
        this.selectLoginVisitsUrlStatement.bindUTF8StringParameter(1, enc);
        try {
            while (this.selectLoginVisitsUrlStatement.executeStep()) {
                visits.push({
                    time: this.selectLoginVisitsUrlStatement.row.time,
                    wireless: this.selectLoginVisitsUrlStatement.row.wireless
                });
            }
        }
        finally {
            this.selectLoginVisitsUrlStatement.reset();
        }
        
        return visits;
    },
    
    // Select time
    selectLoginactualTime: function(){
        var statement = this.dbConn.createStatement("SELECT * FROM loginactual");
        var vals = [];
        
        try {
            while (statement.executeStep()) {
                vals.push(statement.row.time);
            }
        }
        finally {
            statement.reset();
        }
        
        return vals;
    },
    
    // Delete all
    deleteLoginItemAll: function(){
        executeStatement(this.deleteLoginItemAllStatement);
    },
    
    // Delete by site
    deleteLoginItemSite: function(site){
        this.deleteLoginItemSiteStatement.bindUTF8StringParameter(0, site);
        
        executeStatement(this.deleteLoginItemSiteStatement);
    },
    
    // Delete by url and encryption
    deleteLoginItemUrl: function(siteUrl, enc){
        this.deleteLoginItemUrlStatement.bindUTF8StringParameter(0, siteUrl);
        this.deleteLoginItemUrlStatement.bindUTF8StringParameter(1, enc);
        
        executeStatement(this.deleteLoginItemUrlStatement);
    },
    
    // Delete by time
    deleteLoginactualTime: function(time){
        this.deleteLoginactualTimeStatement.bindUTF8StringParameter(0, time);
        
        executeStatement(this.deleteLoginactualTimeStatement);
    },
    
    ///////////////////////////////////
    // Table "prediction"
    ///////////////////////////////////
    // Insert
    insertPrediction: function(site, siteUrl, actionUrl, enc, time){
        this.insertPredictionStatement.bindUTF8StringParameter(0, site);
        this.insertPredictionStatement.bindUTF8StringParameter(1, siteUrl);
        this.insertPredictionStatement.bindUTF8StringParameter(2, actionUrl);
        this.insertPredictionStatement.bindUTF8StringParameter(3, enc);
        this.insertPredictionStatement.bindUTF8StringParameter(4, time);
        
        executeStatement(this.insertPredictionStatement);
    },
    
    // Select action url by url
    selectPrediction: function(siteUrl){
        var predicts = [];
        this.selectPredictionStatement.bindUTF8StringParameter(0, siteUrl);
        
        try {
            while (this.selectPredictionStatement.executeStep()) {
                predicts.push(this.selectPredictionStatement.row.actionUrl);
            }
        }
        finally {
            this.selectPredictionStatement.reset();
        }
        return predicts;
    },
    
    // Select time
    selectPredictionTime: function(){
        var statement = this.dbConn.createStatement("SELECT * FROM prediction");
        var vals = [];
        
        try {
            while (statement.executeStep()) {
                vals.push(statement.row.time);
            }
        }
        finally {
            statement.reset();
        }
        
        return vals;
    },
    
    // Delete by url and action url
    deletePrediction: function(siteUrl, actionUrl){
        this.deletePredictionStatement.bindUTF8StringParameter(0, siteUrl);
        this.deletePredictionStatement.bindUTF8StringParameter(1, actionUrl);
        
        executeStatement(this.deletePredictionStatement);
    },
    
    // Delete by time
    deletePredictionTime: function(time){
        this.deletePredictionTimeStatement.bindUTF8StringParameter(0, time);
        
        executeStatement(this.deletePredictionTimeStatement);
    },
    
    ///////////////////////////////////
    // Table "logindetected"
    ///////////////////////////////////
    // Insert
    insertLogindetected: function(site, siteUrl, actionUrl, enc, time){
        piigeon.dbController.deleteLogindetected(site, actionUrl, enc);
        
        this.insertLogindetectedStatement.bindUTF8StringParameter(0, site);
        this.insertLogindetectedStatement.bindUTF8StringParameter(1, siteUrl);
        this.insertLogindetectedStatement.bindUTF8StringParameter(2, actionUrl);
        this.insertLogindetectedStatement.bindUTF8StringParameter(3, enc);
        this.insertLogindetectedStatement.bindUTF8StringParameter(4, time);
        
        executeStatement(this.insertLogindetectedStatement);
    },
    
    // Select time
    selectLogindetectedTime: function(){
        var statement = this.dbConn.createStatement("SELECT * FROM logindetected");
        var vals = [];
        
        try {
            while (statement.executeStep()) {
                vals.push(statement.row.time);
            }
        }
        finally {
            statement.reset();
        }
        
        return vals;
    },
    
    // Delete by site, action url, and encryption
    deleteLogindetected: function(site, actionUrl, enc){
        this.deleteLogindetectedStatement.bindUTF8StringParameter(0, site);
        this.deleteLogindetectedStatement.bindUTF8StringParameter(1, actionUrl);
        this.deleteLogindetectedStatement.bindUTF8StringParameter(2, enc);
        
        executeStatement(this.deleteLogindetectedStatement);
    },
    
    // Delete by time
    deleteLogindetectedTime: function(time){
        this.deleteLogindetectedTimeStatement.bindUTF8StringParameter(0, time);
        
        executeStatement(this.deleteLogindetectedTimeStatement);
    },
    
    ///////////////////////////////////
    // Table "comparison"
    ///////////////////////////////////
    // Insert
    insertLoginComparison: function(site, siteUrl, actionUrl, enc, timep, host, httpUrl, https, dir, mech, timem, correct, reserved){
        this.insertComparisonStatement.bindUTF8StringParameter(0, site);
        this.insertComparisonStatement.bindUTF8StringParameter(1, siteUrl);
        this.insertComparisonStatement.bindUTF8StringParameter(2, actionUrl);
        this.insertComparisonStatement.bindUTF8StringParameter(3, enc);
        this.insertComparisonStatement.bindUTF8StringParameter(4, timep);
        this.insertComparisonStatement.bindUTF8StringParameter(5, host);
        this.insertComparisonStatement.bindUTF8StringParameter(6, httpUrl);
        this.insertComparisonStatement.bindUTF8StringParameter(7, https);
        this.insertComparisonStatement.bindUTF8StringParameter(8, dir);
        this.insertComparisonStatement.bindUTF8StringParameter(9, mech);
        this.insertComparisonStatement.bindUTF8StringParameter(10, timem);
        this.insertComparisonStatement.bindUTF8StringParameter(11, correct);
        this.insertComparisonStatement.bindUTF8StringParameter(12, reserved);
        
        executeStatement(this.insertComparisonStatement);
    },
    
    // Select time
    selectComparisonTime: function(){
        var statement = this.dbConn.createStatement("SELECT * FROM comparison");
        var vals = [];
        
        try {
            while (statement.executeStep()) {
                vals.push(statement.row.timep);
            }
        }
        finally {
            statement.reset();
        }
        
        return vals;
    },
    
    // Delete by time
    deleteComparisonTime: function(timep){
        this.deleteComparisonTimeStatement.bindUTF8StringParameter(0, timep);
        
        executeStatement(this.deleteComparisonTimeStatement);
    },
    
    ///////////////////////////////////
    // Table "wireless"
    ///////////////////////////////////
    // Insert
    insertWireless: function(id, max, maxmac, ssid, mac, ss, time){
        this.insertWirelessStatement.bindUTF8StringParameter(0, id);
        this.insertWirelessStatement.bindUTF8StringParameter(1, max);
        this.insertWirelessStatement.bindUTF8StringParameter(2, maxmac);
        this.insertWirelessStatement.bindUTF8StringParameter(3, ssid);
        this.insertWirelessStatement.bindUTF8StringParameter(4, mac);
        this.insertWirelessStatement.bindUTF8StringParameter(5, ss);
        this.insertWirelessStatement.bindUTF8StringParameter(6, time);
        
        executeStatement(this.insertWirelessStatement);
    },
    
    // Select the name and mac address of the associated AP with the strongest signal by mac address
    selectWireless: function(mac){
        var vals = [];
        
        this.selectWirelessStatement.bindUTF8StringParameter(0, mac);
        try {
            while (this.selectWirelessStatement.executeStep()) {
                vals.push({
                    maxssid: this.selectWirelessStatement.row.max,
                    maxmac: this.selectWirelessStatement.row.maxmac
                });
            }
        }
        finally {
            this.selectWirelessStatement.reset();
        }
        
        return vals;
    },
    
    // Select mac address by the mac address of the associated AP with the strongest signal
    selectWirelessFromMaxMac: function(maxmac){
        var vals = [];
        
        this.selectWirelessFromMaxMacStatement.bindUTF8StringParameter(0, maxmac);
        try {
            while (this.selectWirelessFromMaxMacStatement.executeStep()) {
                vals.push({
                    mac: this.selectWirelessFromMaxMacStatement.row.mac
                });
            }
        }
        finally {
            this.selectWirelessFromMaxMacStatement.reset();
        }
        
        return vals;
    },
    
    // Select the id of the last item
    readCountWireless: function(){
        var statement = this.dbConn.createStatement("SELECT distinct id FROM wireless");
        var vals = [];
        
        try {
            while (statement.executeStep()) {
                vals.push(statement.row.id);
            }
        }
        finally {
            statement.reset();
        }
        if (vals.length == 0) 
            return 0;
        return vals[vals.length - 1];
    },
    
    ///////////////////////////////////
    // Table "wirelessuser"
    ///////////////////////////////////
    // Insert
    insertWirelessUser: function(mac, location, time){
        this.insertWirelessUserStatement.bindUTF8StringParameter(0, mac);
        this.insertWirelessUserStatement.bindUTF8StringParameter(1, location);
        this.insertWirelessUserStatement.bindUTF8StringParameter(2, time);
        
        executeStatement(this.insertWirelessUserStatement);
    },
    
    // Select location by mac address
    selectWirelessUser: function(mac){
        var vals = [];
        
        this.selectWirelessUserStatement.bindUTF8StringParameter(0, mac);
        try {
            while (this.selectWirelessUserStatement.executeStep()) {
                vals.push(this.selectWirelessUserStatement.row.location);
            }
        }
        finally {
            this.selectWirelessUserStatement.reset();
        }
        
        return vals;
    },
    
    ///////////////////////////////////
    // Table "locationcache"
    ///////////////////////////////////
    // Insert
    insertLocationcache: function(latitude, longitude, address){
        this.insertLocationcacheStatement.bindUTF8StringParameter(0, latitude);
        this.insertLocationcacheStatement.bindUTF8StringParameter(1, longitude);
        this.insertLocationcacheStatement.bindUTF8StringParameter(2, address);
        
        executeStatement(this.insertLocationcacheStatement);
    },
	
    // Select physical address by lat/long
    selectLocationcache: function(latitude, longitude){
        var vals = [];
        
        this.selectLocationcacheStatement.bindUTF8StringParameter(0, latitude);
        this.selectLocationcacheStatement.bindUTF8StringParameter(1, longitude);
		
        try {
            while (this.selectLocationcacheStatement.executeStep()) {
                vals.push(this.selectLocationcacheStatement.row.address);
            }
        }
        finally {
            this.selectLocationcacheStatement.reset();
        }
        return vals;
    },

    ///////////////////////////////////
    // Table "server_temp_login"
    ///////////////////////////////////
    // Insert
    insertTempLogin: function(site, page, action, actionp, referrer, mechanism, passenc, pageenc, cookies, reserved){
    	// TODO detect whether labeled as "old" which means that this piece of record has
        // already been sent
        var reserveddd = this.selectTempLoginItem(site, page, action, referrer, reserved);
        
        this.insertTempLoginStatement.bindUTF8StringParameter(0, site);
        this.insertTempLoginStatement.bindUTF8StringParameter(1, page);
        this.insertTempLoginStatement.bindUTF8StringParameter(2, action);
        this.insertTempLoginStatement.bindUTF8StringParameter(3, actionp);
        this.insertTempLoginStatement.bindUTF8StringParameter(4, referrer);
        this.insertTempLoginStatement.bindUTF8StringParameter(5, mechanism);
        this.insertTempLoginStatement.bindUTF8StringParameter(6, passenc);
        this.insertTempLoginStatement.bindUTF8StringParameter(7, pageenc);
        this.insertTempLoginStatement.bindUTF8StringParameter(8, cookies);
        this.insertTempLoginStatement.bindUTF8StringParameter(9, reserveddd);

        executeStatement(this.insertTempLoginStatement);
    },
    
    // Update by site, url, action url, and referer
    updateTempLogin: function(logins){
    	for (var i=0;i<logins.length;i++){
    		if (logins[i].reserved.substring(0,3) != "old") {
    	        this.updateTempLoginStatement.bindUTF8StringParameter(0, "old" + logins[i].reserved);
    	        this.updateTempLoginStatement.bindUTF8StringParameter(1, logins[i].site);
    	        this.updateTempLoginStatement.bindUTF8StringParameter(2, logins[i].page);
    	        this.updateTempLoginStatement.bindUTF8StringParameter(3, logins[i].action);
    	        this.updateTempLoginStatement.bindUTF8StringParameter(4, logins[i].referrer);
    	        
                executeStatement(this.updateTempLoginStatement);
    		}
    	}
    },
    
    // Select all
    selectTempLogin: function(){
        var logins = [];
        
        try {
            while (this.selectTempLoginStatement.executeStep()) {
                logins.push({
                	site: this.selectTempLoginStatement.row.site,
                	page: this.selectTempLoginStatement.row.page,
                	action: this.selectTempLoginStatement.row.action,
                	actionp: this.selectTempLoginStatement.row.actionp,
                	referrer: this.selectTempLoginStatement.row.referrer,
                	mechanism: this.selectTempLoginStatement.row.mechanism,
                	passenc: this.selectTempLoginStatement.row.passenc,
                	pageenc: this.selectTempLoginStatement.row.pageenc,
                	cookies: this.selectTempLoginStatement.row.cookies,
                	reserved: this.selectTempLoginStatement.row.reserved
                });
            }
        }
        finally {
            this.selectTempLoginStatement.reset();
        }
        
        return logins;
    },
    
    // Select all by site, url, action url, and referer
    selectTempLoginItem: function(site, page, action, referrer, reserved){
        var logins = [];
        this.selectTempLoginItemStatement.bindUTF8StringParameter(0, site);
        this.selectTempLoginItemStatement.bindUTF8StringParameter(1, page);
        this.selectTempLoginItemStatement.bindUTF8StringParameter(2, action);
        this.selectTempLoginItemStatement.bindUTF8StringParameter(3, referrer);

        try {
            while (this.selectTempLoginItemStatement.executeStep()) {
                logins.push({
                	site: this.selectTempLoginItemStatement.row.site,
                	page: this.selectTempLoginItemStatement.row.page,
                	action: this.selectTempLoginItemStatement.row.action,
                	referrer: this.selectTempLoginItemStatement.row.referrer,
                	reserved: this.selectTempLoginItemStatement.row.reserved
                });
            }
        }
        finally {
            this.selectTempLoginItemStatement.reset();
        }

        if (logins.length == 0){
        	return reserved;
        }
        else{
        	var ch = false; // Check whether there is an item
        	for (var i = 0;i < logins.length; i++){
                // Old means that this item has already been sent and should be ignored here
        		if (logins[i].reserved == "old" + reserved){
        			this.deleteTempLogin(site, page, action, referrer, logins[i].reserved);
        			ch = true;
        		}
        		else if (logins[i].reserved == reserved){
        			this.deleteTempLogin(site, page, action, referrer, logins[i].reserved);
        		}
        	}
        	if (ch)
    			return "old" + reserved;
        	else
        		return reserved;
        }
        return;
    },
    
    // Delete by site, url, action url, referer, reserved (timestamp + whether it is old)
    deleteTempLogin: function(site, page, action, referrer, reserved){
        this.deleteTempLogin1Statement.bindUTF8StringParameter(0, site);
        this.deleteTempLogin1Statement.bindUTF8StringParameter(1, page);
        this.deleteTempLogin1Statement.bindUTF8StringParameter(2, action);
        this.deleteTempLogin1Statement.bindUTF8StringParameter(3, referrer);
        this.deleteTempLogin1Statement.bindUTF8StringParameter(4, reserved);
        
        executeStatement(this.deleteTempLogin1Statement);
    },
    
    // Delete all
    deleteAllTempLogin: function(){
        executeStatement(this.deleteTempLoginStatement);
    },

    ///////////////////////////////////
    // Table "server_temp_record"
    ///////////////////////////////////
    // Insert
    insertTempRecord: function(loginlast, reserved){

        // piigeon.dbController.deleteLogindetected(site, page, action,
		// referrer);
        
        this.insertTempRecordStatement.bindUTF8StringParameter(0, loginlast);
        this.insertTempRecordStatement.bindUTF8StringParameter(1, reserved);
        
        executeStatement(this.insertTempRecordStatement);
    },
    
    // Select the last date of logins in record
    selectTempRecord: function(){
        var records = [];
        
        try {
            while (this.selectTempRecordStatement.executeStep()) {
            	records.push({
            		loginlast: this.selectTempRecordStatement.row.loginlast
            	});
            }
        }
        finally {
            this.selectTempRecordStatement.reset();
        }
        
        return records;
    },
    
    ///////////////////////////////////
    // Table "server_temp_evaluation"
    ///////////////////////////////////
    // Insert
    insertTempEvaluation: function(type, url, data, reserved){

        this.insertTempEvaluationStatement.bindUTF8StringParameter(0, type);
        this.insertTempEvaluationStatement.bindUTF8StringParameter(1, url);
        this.insertTempEvaluationStatement.bindUTF8StringParameter(2, data);
        this.insertTempEvaluationStatement.bindUTF8StringParameter(3, reserved);
        
        executeStatement(this.insertTempEvaluationStatement);
    },
    
    // Select distinct type, url, data, and reserved
    selectTempEvaluation: function(){
        var records = [];
        
        try {
            while (this.selectTempEvaluationStatement.executeStep()) {
            	records.push({
            		type: this.selectTempEvaluationStatement.row.type,
            		url: this.selectTempEvaluationStatement.row.url,
            		data: this.selectTempEvaluationStatement.row.data,
            		reserved: this.selectTempEvaluationStatement.row.reserved
            	});
            }
        }
        finally {
            this.selectTempEvaluationStatement.reset();
        }
        
        return records;
    },
    
    // Delete all
    deleteTempEvaluation: function(){
        executeStatement(this.deleteTempEvaluationStatement);
    }
};

/////////////////////////////////// Utility functions ////////////////////////////////////

// Safely execute the statement and reset if failed.
function executeStatement(statement) {
    try {
        statement.execute();
    }
    finally {
        statement.reset();
    }
}
