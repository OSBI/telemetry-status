var fs = require('fs');
var express = require('express');
var request = require('superagent');
var app = express.createServer();

// Set up status object
global.telemetryStatus = {};
telemetryStatus.status = {};
telemetryStatus.hostsFile = process.env.TELEMETRY_STATUS_HOSTS || __dirname + "/hosts";
telemetryStatus.refreshRate = process.env.TELEMETRY_STATUS_REFRESH || 5000;
telemetryStatus.port = process.argv[2] || 8000;

// Update hosts on hosts file change
telemetryStatus.updateHosts = function update_hosts(curr, prev) {
    if (curr && prev && curr.mtime && prev.mtime && curr.mtime == prev.mtime) return;
    fs.readFile(telemetryStatus.hostsFile, "utf8", function(err, data) {
        // Report any errors reading the hosts file
        if (err) {
            console.error(err);
            return;
        }
        
        // Prepare the hosts
        telemetryStatus.hosts = [];
        var hosts = data.split("\n");
        for (var i in hosts) {
            telemetryStatus.hosts.push(hosts[i].trim());
        }
    });
};
telemetryStatus.updateHosts();
//fs.watchFile(telemetryStatus.hostsFile, telemetryStatus.updateHosts);

// Update status periodically
telemetryStatus.updateStatus = function update_status(iter) {
    if (! iter) iter = 0;
    var host = telemetryStatus.hosts[iter];
    if (host !== undefined) {
        request.get(host)
        .on('error', function(err) { 
            telemetryStatus.status[host] = {
                status: err.message,
                last_update: new Date()
            };
        })
        .end(function(err, res) {
            if (typeof res !== "object" || res.body.status === undefined) {
                telemetryStatus.status[host] = {
                    status: "Host not available",
                    last_update: new Date()
                };
            } else {
                telemetryStatus.status[host] = res.body;
                telemetryStatus.status[host].last_update = new Date();
            }
        });
        telemetryStatus.updateStatus(iter + 1);
    }
};
setInterval(telemetryStatus.updateStatus, telemetryStatus.refreshRate);

// Set up server
app.get("/status", function(req, res, next) {
    res.send({
        refresh_rate: telemetryStatus.refreshRate,
        status: telemetryStatus.status
    });
});
app.use(express.static(__dirname + "/static"));
app.listen(telemetryStatus.port);
console.log("Listening on port", telemetryStatus.port);