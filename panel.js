// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var count = 0;
chrome.devtools.network.onRequestFinished.addListener(function(request) {
	count++;
	if (count == 1) {
		console.log(request.startedDateTime);
	}
	else if (count == 5) {
		console.log(request.startedDateTime);
	}
});

function calcTimeInSec(h,m,s,ms) {
	var timeInSec = parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s) + parseFloat(ms)/1000;
	return timeInSec;
}

/* round function */
function toDecimal2(x) {  
    var f = parseFloat(x);  
    if (isNaN(f)) {  
        return false;  
    }  
    var f = Math.round(x*100)/100;  
    var s = f.toString();  
    var rs = s.indexOf('.');  
    if (rs < 0) {  
        rs = s.length;  
        s += '.';  
    }  
    while (s.length <= rs + 2) {  
        s += '0';  
    }  
    return s;  
}  

var startTimeInSec = 0.0, ttfbTime = 0.0;
function listen() {
	var actionButton = document.querySelector('#actionButton');
	actionButton.addEventListener("click", function(){
		chrome.devtools.network.getHAR(function (log) {
			var initialEntry = log.entries[0];
			var initalStartDate = initialEntry.startedDateTime;
			startTimeInSec = calcTimeInSec(initalStartDate.getHours(), initalStartDate.getMinutes(), initalStartDate.getSeconds(), initalStartDate.getMilliseconds());
			var resultDom = document.querySelector('#result');
			resultDom.innerHTML += startTimeInSec + '';

			var dnsTimeJSON, connectTimeJSON, sendTimeJSON, waitTimeJSON;
	        dnsTimeJSON = initialEntry['timings']['dns'];
	        connectTimeJSON = initialEntry['timings']['connect'];
	        sendTimeJSON = initialEntry['timings']['send'];
	        waitTimeJSON = initialEntry['timings']['wait'];
	        var dnsTime = dnsTimeJSON >= 0 ? dnsTimeJSON : 0;
	        var connectTime = connectTimeJSON >= 0 ? connectTimeJSON : 0;
	        var sendTime = sendTimeJSON >= 0 ? sendTimeJSON : 0;
	        var waitTime = waitTimeJSON >= 0 ? waitTimeJSON : 0;
	        ttfbTime = dnsTime + connectTime + sendTime + waitTime;
	        resultDom.innerHTML += '<br>' + ttfbTime + '';

	        var totalReq = log.entries.length;
	        var requiredReq = totalReq >= 300? 300 : parseInt(totalReq * 0.7);
			var doneMomentList = [];
	        var objDoneMoment;
	        var entries = log.entries;
	        var timeObject;
	        for (var i = 0; i < entries.length; i++) {
	        	timeObject = entries[i].startedDateTime;
	            objDoneMoment = calcTimeInSec(timeObject.getHours(), timeObject.getMinutes(), timeObject.getSeconds(), timeObject.getMilliseconds());
	            objDoneMoment += parseFloat(entries[i]['time'])/1000;
	            doneMomentList.push(objDoneMoment);
	            // console.log(objDoneMoment);
	        }

	        doneMomentList.sort();
	        var requiredReqMoment = doneMomentList[requiredReq - 1]
	        var requiredReqDoneTime = requiredReqMoment - startTimeInSec;
	       	resultDom.innerHTML += '<br> requiredReqDoneTime ' + requiredReqDoneTime + '';

	       	resultDom.innerHTML = '\
	       	<table class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">\
  			<thead>\
    			<tr>\
			      <th>首字节到达时间</th>\
			      <th>前300（70%）对象完成时间</th>\
    			</tr>\
			</thead>\
			<tbody>\
			    <tr>\
			      <td>' + toDecimal2(ttfbTime)+ ' ms</td>\
			      <td>' + toDecimal2(requiredReqDoneTime) + ' s</td>\
			    </tr>\
			</tbody>\
			</table>\
';

		});
	});
  	console.log('listen');
}

window.addEventListener('load', listen);

