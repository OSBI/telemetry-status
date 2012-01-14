var telemetryStatus = {
    updateStatus: function() {
        $.get("/status", function(data) {
            telemetryStatus.status = data.status;
            telemetryStatus.refreshRate = data.refresh_rate;
            
            $(".host").remove();
            for (var i in data.status) {
                var host = data.status[i];
                var $row = $("<tr />").addClass("host");
                if (host.status == "operational" && host.errors == 0) { 
                    $row.addClass("operational");
                } else if (host.errors > 0) {
                    $row.addClass("errors");
                } else {
                    $row.addClass("distressed");
                }
                $row.appendTo($("#status"));
                $("<td><a href='" + i + "'>" + i + "</a></td>").appendTo($row);
                $("<td>" + host.errors + "</td>").appendTo($row);
                if (host.last_error) {
                    $("<td><abbr title='" + host.last_error.message + "'>" + host.last_error.time + "</abbr> (<a href='" + i + "/error/clear'>clear</a>)</td>").appendTo($row);
                } else {
                    $("<td>None</td>").appendTo($row);
                }
                $("<td>" + host.last_update + "</td>").appendTo($row);
            }
        });
    },
    
    refreshRate: 1000,
    status: {}
};

telemetryStatus.updateStatus();
setInterval(telemetryStatus.updateStatus, telemetryStatus.refreshRate);