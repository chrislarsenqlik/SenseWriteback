var sensehostname = 'win-6mdp3q63fnj'
var sense_cert_hostname = 'win-6md3q63fnj'
var middleware_hostname = 'win-6md3q63fnj'
var DSN = 'Beehive';
var DSN_DB = 'beehive';
var DSN_UID = 'db_superuser';
var DSN_PWD = 'db_superuser';
var appname = 'Financial Planning'
var taskname = 'Reload Financial Planning'
var middleware_port = '12334'
var middleware_notify_port = '1234'
var certificate = "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\"+sensehostname+"\\client.pem";
var reloadtask_id = "e8b6e035-28c2-4714-a793-bc0350ae196f";
var middlewareurl = 'https://'+middleware_hostname+':'+middleware_port;
var http = require('http');
var https = require('https');
var fs = require('fs');
var db = require('odbc')();
var request = require('request');

var reload_taskid_options = {
  rejectUnauthorized: false,
  hostname: sensehostname,
  port: 4242,
  path: '/qrs/task?xrfkey=abcdefghijklmnop&filter=name eq \''+taskname+'\'',
  uri: 'https://'+sensehostname+':4242/qrs/task?xrfkey=abcdefghijklmnop&filter=name eq \''+taskname+'\'',
  method: 'GET',
  headers: {
        'X-Qlik-xrfkey' : 'abcdefghijklmnop',
        'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
    },
  key: fs.readFileSync(certificate),
  cert: fs.readFileSync(certificate)
};



request.get(reload_taskid_options, function optionalCallback (err, httpResponse, body) {
  if (err) {
    return console.error('task get failed:', err);
     } else {
      //console.log(body);
      var resp = JSON.parse(httpResponse.body)
      reloadtask_id = reloadtask_id;
      //console.log(resp);
     }
    //console.log(httpResponse);
});
console.log('reload task id: '+reloadtask_id)
// Setup some https server options
var cfg = {
          ssl: true,
          port: 12345,
          ssl_key: fs.readFileSync(certificate),
          ssl_cert: fs.readFileSync(certificate)
        };

var httpServ = ( cfg.ssl ) ? require('https') : require('http');
var WebSocketServer = require('ws').Server;
var app = null;
var processRequest = function( req, res ) {
        //res.writeHead(200);
        res.end("Websockets go forth!\n");
};
if ( cfg.ssl ) {
    app = httpServ.createServer({
        // providing server with  SSL key/cert
        key: fs.readFileSync(certificate),
        cert: fs.readFileSync(certificate)
    }, processRequest ).listen( cfg.port );
    //console.log(app)
} else {
    app = httpServ.createServer( processRequest ).listen( cfg.port );
}

var https_options = {
  key: fs.readFileSync(certificate),
  cert: fs.readFileSync(certificate)
};

var sense_notification_options = {
  //hostname: sensehostname,
  //port: 4242,
  //path: '/qrs/notification?xrfkey=abcdefghijklmnop&name=executionresult',
  rejectUnauthorized: false,
  uri: 'https://'+sensehostname+':4242/qrs/notification?xrfkey=abcdefghijklmnop&name=executionresult',
  //method: 'POST',
  headers: {
        'X-Qlik-xrfkey' : 'abcdefghijklmnop',
        'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik',
        'Content-Type' : 'application/json',
        'Accept' : 'application/json',
        'Accept-Charset' : 'utf-8; q=0.9, us-ascii;q=0.1, iso-8859-1'
    },
  key: fs.readFileSync(certificate),
  cert: fs.readFileSync(certificate),
  body: 'http://'+middleware_hostname+':'+middleware_notify_port
}

var reload_task_options = {
  rejectUnauthorized: false,
  hostname: sensehostname,
  port: 4242,
  path: '/qrs/task/'+reloadtask_id+'/start?xrfkey=abcdefghijklmnop',
  method: 'POST',
  headers: {
        'X-Qlik-xrfkey' : 'abcdefghijklmnop',
        'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
    },
  key: fs.readFileSync(certificate),
  cert: fs.readFileSync(certificate)
};


var wss = new WebSocketServer( { server: app } );
var restify = require('restify');

restify.CORS.ALLOW_HEADERS.push('accept');
restify.CORS.ALLOW_HEADERS.push('X-Qlik-xrfkey');
restify.CORS.ALLOW_HEADERS.push('X-Qlik-User');
restify.CORS.ALLOW_HEADERS.push('sid');
restify.CORS.ALLOW_HEADERS.push('lang');
restify.CORS.ALLOW_HEADERS.push('origin');
restify.CORS.ALLOW_HEADERS.push('withcredentials');
restify.CORS.ALLOW_HEADERS.push('x-requested-with');
var server = restify.createServer(https_options);
server.use(restify.CORS());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.queryParser());
var request = require('request');

server.listen(12334, function () {
    console.log('%s listening at %s', server.name, server.url);
});

wss.broadcast = function(data) {
     for (var i in this.clients)
       this.clients[i].send(data);
}

wss.on('connection', function(ws) {
    //ws.send('got a websocket connection');
    console.log('got a connection')
    ws.on('message', function(message) {
        console.log(message);
        wss.broadcast(message);
    });
});

console.log('Websocket Server running at '+sensehostname+':'+cfg.port);

request.post(sense_notification_options, function optionalCallback (err, httpResponse, body) {
  if (err) {
    return console.error('notification subscription creation failed:', err);
     }
    //console.log(httpResponse);
  });

http.createServer(function (req, res) {
    var body = '';

    req.on('data', function(chunk) {
                 body += chunk;
    });

    req.on('end', function() {
       console.log(JSON.parse(body));
       var notification = JSON.parse(body);
       var id = notification[0].objectID;
       var type = notification[0].objectType;

       //Get the data about that result and log it out, options seen above as well, but overridden here.
        var exec_result_options = {
          rejectUnauthorized: false,
          hostname: sensehostname,
          port: 4242,
          path: '/qrs/executionresult/'+id+'?xrfkey=abcdefghijklmnop',
          method: 'GET',
          headers: {
                'X-Qlik-xrfkey' : 'abcdefghijklmnop',
                'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
            },
         key: fs.readFileSync(certificate),
         cert: fs.readFileSync(certificate)
        };



      https.get(exec_result_options, function(res) {
        //console.log(res)
          res.on("data", function(chunk) {
            //console.log(chunk)
            var chunkjson = JSON.parse(chunk);
             //console.log(chunkjson);
            var status = chunkjson.status;
            var taskStartTime= chunkjson.startTime
            var taskStopTime= chunkjson.stopTime
            var statustext = '';
            //console.log(status);
            if (status===1) {
                var statustext = 'Task Reload Started'
            } else if (status ===3) {
                var statustext = 'Task Reload Succeeded'
            } else if (status ===4) {
                var statustext = 'Task Reload Failed'
            }

            console.log(statustext);
            console.log('start time: '+taskStartTime);
            console.log('stop time: '+taskStopTime);

            //Broadcast to connected websocket clients
            wss.broadcast(statustext);

        });
      }).on('error', function(e) {
      console.log("Got error: " + e.message);
      });                  

    });

    //res.writeHead(200, {'Content-Type': 'text/plain'});
}).listen(middleware_notify_port);


console.log('Notification Server running at 0.0.0.0s:1234'); 

function Writeback (req, res, next) {
    var _this = this

    db.open("DSN="+DSN+";DATABASE="+DSN_DB+"; UID="+DSN_UID+"; PWD="+DSN_PWD, function(err) {
        if (err) {
          console.log(err);
          return res.send({error: 500}); 
        }
       for (var i = 0, len = req.body.Rows.length; i < len; i++) {
        //console.log('each record');
           var ins = 'Insert into ' 
            ins += req.body.TableName + ' (PeriodNo, BudgetAmount, ActualAmount, ForecastAmount)';
              
              /////////// Headers to insert should be dynamic, but need expression labels in qvpp!!
              // for (var j = 0, clen = req.body.Headers.length; j < clen; j++) {
              //      //console.log(req.body.Headers[j].Name);
              //      ins += "'"+req.body.Headers[j].Name+"'"
              //      if (j == clen-1) 
              //        {ins+=''}
              //      else
              //        {ins+=','}  
              //  }
           ins += ' values ('
           
       	    for (var j = 0, clen = req.body.Rows[i].Cells.length; j < clen; j++) {
       	    	  ins += "'"+req.body.Rows[i].Cells[j].Text+"'"
   	    	      if (j == clen-1) 
   	    	      	{ins+=''}
   	    	      else
   	    	      	{ins+=','}  
       	      }
           ins += ')'
           console.log(ins);

	           db.query(ins, function (err) {
	        	   if (err) {
	        	   	//return 
	        	   	res.send({error: 400}); 
                }
                   
	           }) ;
       }
        db.close(function(){});  
        res.send({success: 200})
        console.log(ins)
       });
};


function WritebackSenseServer (req, res, next) {
    var sqlerror;
    var _this = this
    console.log('qlik test server');
    console.log(req.body);
    var Body=JSON.parse(req.body);

    db.open("DSN="+DSN+";DATABASE="+DSN_DB+"; UID="+DSN_UID+"; PWD="+DSN_PWD, function(err) {
        if (err) {
          console.log(err);
          //return res.send({error: 500}); 
        }
 	  for (var i = 0, len = Body.Rows.length; i < len; i++) {
           var ins = 'Insert into ' 
            ins += Body.TableName + ' (';
              
              for (var j = 0, clen = Body.Headers.length; j < clen; j++) {
                   ins += Body.Headers[j].Name
                   if (j == clen-1) 
                     {ins+=''}
                   else
                     {ins+=','}  
               }
           ins += ') values ('
           
       	    for (var j = 0, clen = Body.Rows[i].Cells.length; j < clen; j++) {
				if (Body.Rows[i].Cells[j].DataType ==='string') {
		       	    	  ins += "'"+ Body.Rows[i].Cells[j].Text.replace('$','').replace(',','')+"'"
				} else {
					ins += Body.Rows[i].Cells[j].Text.replace('$','').replace(',','')
				}
   	    	      if (j == clen-1) 
   	    	      	{ins+=''}

   	    	      else
   	    	      	{ins+=','}  
       	      }
           ins += ')'
           console.log(ins);

	           db.query(ins, function (err) {
	        	   if (err) {
				        sqlerror = 'err.message)';
				        console.log(err);
	        	   	//return 
	        	   	//res.send({error: 400}); 
                sqlstatus = 'The SQL side had issues';
                console.log(sqlstatus)
             		    } else {
                 		sqlstatus = 'Data Submitted To Sql';
  		              console.log(sqlstatus);
                    wss.broadcast(sqlstatus);
                    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
                    	           			var reload_task_options = {
						  rejectUnauthorized: false,
						  hostname: sensehostname,
						  port: 4242,
						  path: '/qrs/task/'+reloadtask_id+'/start?xrfkey=abcdefghijklmnop',
						  method: 'POST',
						  headers: {
						        'X-Qlik-xrfkey' : 'abcdefghijklmnop',
						        'X-Qlik-User' : 'UserDirectory='+sensehostname+'; UserId=qlik'
						    },
						  key: fs.readFileSync(certificate),
						  cert: fs.readFileSync(certificate)
						};

	           			//res.send({"Message": "Data Submission Succeeded", success: 200})
			         	https.get(reload_task_options, function(res) {
						      console.log("Got response: " + res.statusCode);
						       // res.send({'Status': res.statusCode,
						       //  'StatusMsg': 'Reload Kicked Off'})
						       wss.broadcast('Reloading....');

						      res.on("data", function(chunk) {
						        console.log("BODY: " + chunk);

						      });
						    }).on('error', function(e) {
						      console.log("Got error: " + e.message);
						    });
                    // request.post(middlewareurl+'/Reload', function optionalCallback (err, httpResponse, body) {
                    //   if (err) {
                    //     return console.error('reload failed:', err);
                    //      }
                    //     console.log('Reload successful!  Server responded with:', body);
                    //   });
  	                }
	           }) ;
       }
 	      //res.send({"Message": "Data Submission Succeeded", success: 200})
        wss.broadcast("Data Submission Succeeded");
        db.close(function(){}); 
	       //console.log(sqlstatus);
       });
};  

function WritebackSenseDesktop (req, res, next) {
var sqlerror;
var _this = this;
//console.log(req.body)
var Body=JSON.parse(req.body);

    db.open("DSN="+DSN+";DATABASE="+DSN_DB+"; UID="+DSN_UID+"; PWD="+DSN_PWD, function(err) {
      if (err) {
        console.log(err);
        return res.send({error: 500}); 
      }
 	for (var i = 0, len = Body.Rows.length; i < len; i++) {
     var ins = 'Insert into ' 
      ins += Body.TableName + ' (';
        for (var j = 0, clen = Body.Headers.length; j < clen; j++) {
             ins += Body.Headers[j].Name
             if (j == clen-1) 
               {ins+=''}
             else
               {ins+=','}  
         }
     ins += ') values ('
     
       	    for (var j = 0, clen = Body.Rows[i].Cells.length; j < clen; j++) {
		if (Body.Rows[i].Cells[j].DataType ==='string') {
       	    	  ins += "'"+ Body.Rows[i].Cells[j].Text.replace('$','').replace(',','')+"'"
		} else {
			ins += Body.Rows[i].Cells[j].Text.replace('$','').replace(',','')
		}
	    	      if (j == clen-1) 
	    	      	{ins+=''}

	    	      else
	    	      	{ins+=','}  
   	      }
           ins += ')'
           console.log(ins);

	           db.query(ins, function (err) {
	        	   if (err) {
						sqlerror = 'err.message)';
	           			res.send({"Message": "Data Submission Failed", success: 400})
						console.log(err);
	       		    } else {
	           			sqlerror = 'The SQL side went ok';
	           			console.log(sqlerror)


			    	}
	           }) ;
       }

 	
           db.close(function(){}); 
	         console.log(sqlerror);
       });



};

function Reload (req, res, next) {
              //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
    var https = require('https');
    var fs = require('fs');

    https.get(reload_task_options, function(res) {
      console.log("Got response: " + res.statusCode);


      res.on("data", function(chunk) {
        console.log("BODY: " + chunk);

      });
    }).on('error', function(e) {
      console.log("Got error: " + e.message);
    });
       // res.send({'Status': res.statusCode,
       //  'StatusMsg': 'Reload Kicked Off'})
       wss.broadcast('Reload Submitted');
   
}

server.post('/Reload', Reload);

server.post('/Writeback', Writeback);     //for QV11

server.post('/WritebackSenseDesktop', WritebackSenseDesktop);    

server.post('/WritebackSenseServer', WritebackSenseServer);   