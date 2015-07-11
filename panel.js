// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var count = 0;

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

function reloadPage() {
	var options = {
	    ignoreCache: true,
	    userAgent: undefined
	};
	chrome.devtools.inspectedWindow.reload(options);
}

var startTimeInSec = 0.0, ttfbTime = 0.0;
function listen() {
  
	var actionButton = document.querySelector('#actionButton');
	var clearButton = document.querySelector('#clearButton');
	var reloadButton = document.querySelector('#reloadButton');
	var bodyDom = document.querySelector('#detailBody');
	   	
	clearButton.addEventListener("click", function() {
		bodyDom.innerHTML = "";
	});

	reloadButton.addEventListener("click", function() {
	   	bodyDom.innerHTML = "";
		reloadPage();
	});



	actionButton.addEventListener("click", function(){
		chrome.devtools.network.getHAR(function (log) {
			var initialEntry = log.entries[0];
			var initalStartDate = initialEntry.startedDateTime;
			startTimeInSec = calcTimeInSec(initalStartDate.getHours(), initalStartDate.getMinutes(), initalStartDate.getSeconds(), initalStartDate.getMilliseconds());
			var resultDom = document.querySelector('#result');
			resultDom.innerHTML += startTimeInSec + '';
			var logDom = document.querySelector('#logarea');
			var dnsTimeJSON, connectTimeJSON, sendTimeJSON, waitTimeJSON;
	        dnsTimeJSON = initialEntry['timings']['dns'];
	        connectTimeJSON = initialEntry['timings']['connect'];
	        sendTimeJSON = initialEntry['timings']['send'];
	        waitTimeJSON = initialEntry['timings']['wait'];
	        logDom.innerHTML += 'TTFB -------\r\n';
	        var dnsTime = dnsTimeJSON >= 0 ? dnsTimeJSON : 0;
	        logDom.innerHTML += 'DNS: ' + toDecimal2(dnsTime) + ' ms\r\n';
	        var connectTime = connectTimeJSON >= 0 ? connectTimeJSON : 0;
	        logDom.innerHTML += 'TCP handshake: ' + toDecimal2(connectTime) + ' ms\r\n';

	        var sendTime = sendTimeJSON >= 0 ? sendTimeJSON : 0;
	        logDom.innerHTML += 'Send time: ' + toDecimal2(sendTime) + ' ms\r\n';

	        var waitTime = waitTimeJSON >= 0 ? waitTimeJSON : 0;
	        logDom.innerHTML += 'Wait Time: ' + toDecimal2(waitTime) + ' ms\r\n';

	        ttfbTime = dnsTime + connectTime + sendTime + waitTime;
	        resultDom.innerHTML += '<br>' + toDecimal2(ttfbTime) + '';
	        logDom.innerHTML += 'TTFB -------\r\n';

	        logDom.innerHTML += 'Start Moment: ' + toDecimal2(startTimeInSec) + ' s\r\n';
	        var totalReq = log.entries.length;
	        var requiredReq = totalReq >= 300? 300 : parseInt(totalReq * 0.7);
	        logDom.innerHTML += 'Required Req Number: ' + requiredReq + '\r\n';
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
	        logDom.innerHTML += 'Partial Finish Moment: ' + toDecimal2(requiredReqMoment) + ' s\r\n';
	        var requiredReqDoneTime = requiredReqMoment - startTimeInSec;
	       	resultDom.innerHTML += '<br> requiredReqDoneTime ' + requiredReqDoneTime + '';

	       	resultDom.innerHTML = '\
	       	<table class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">\
			<tbody>\
    			<tr>\
			      <th>首字节到达时间</th>\
			      <th>前300（70%）对象完成时间</th>\
    			</tr>\
			    <tr>\
			      <td>' + toDecimal2(ttfbTime)+ ' ms</td>\
			      <td>' + toDecimal2(requiredReqDoneTime) + ' s</td>\
			    </tr>\
			</tbody>\
			</table>';

		});
	});

	chrome.devtools.network.onRequestFinished.addListener(function(request) {
		var StartDate = request.startedDateTime;
		var startTimeInSec = calcTimeInSec(StartDate.getHours(), StartDate.getMinutes(), StartDate.getSeconds(), StartDate.getMilliseconds());
		// var resultDom = document.querySelector('#result');
		// var logDom = document.querySelector('#logarea');
		var dnsTimeJSON, connectTimeJSON, sendTimeJSON, waitTimeJSON;
	    dnsTimeJSON = request['timings']['dns'];
	    connectTimeJSON = request['timings']['connect'];
	    sendTimeJSON = request['timings']['send'];
	    waitTimeJSON = request['timings']['wait'];
	    var dnsTime = dnsTimeJSON >= 0 ? dnsTimeJSON : 0;
	    var connectTime = connectTimeJSON >= 0 ? connectTimeJSON : 0;
	    var sendTime = sendTimeJSON >= 0 ? sendTimeJSON : 0;
	    var waitTime = waitTimeJSON >= 0 ? waitTimeJSON : 0;
	    var ttfbTime = dnsTime + connectTime + sendTime + waitTime;
	    var doneTime = parseFloat(request['time'])/1000 + 0.0;
	   	var objURL = request['request'].url;
	   	var bodyDom = document.querySelector('#detailBody');
	   	bodyDom.innerHTML += '\
<tr>\r\n\
<td style="white-space: nowrap;text-overflow: ellipsis;">' + objURL +'</td>\r\n\
<td style="white-space: nowrap;text-overflow: ellipsis;">' + transferSizeUnit(request['response']._transferSize) +'</td>\r\n\
<td style="white-space: nowrap;text-overflow: ellipsis;">' + transferTimeUnit(toDecimal2(ttfbTime)) + '</td>\r\n\
<td style="white-space: nowrap;text-overflow: ellipsis;">' + toDecimal2(doneTime) + ' s</td>\r\n\
</tr>';
	});

  	console.log('listen');
}

function transferTimeUnit(time) {
	if (time > 1000)
		return toDecimal2(time/1000) + ' s';
	else
		return time + ' ms';
}

function transferSizeUnit(size) {
	if (size < 1000 * 1000)
		return toDecimal2(size/1000) + ' KB';
	else 
		return toDecimal2(size/1000000) + ' MB';
}

window.addEventListener('load', listen);

