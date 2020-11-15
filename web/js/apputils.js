function timestamp_to_str(timestamp){
	if(timestamp == null) return '';
	var d = new Date(timestamp * 1000);
	var yyyy = d.getFullYear().toString();
	var mo = lpad((d.getMonth()+1).toString(), 2, '0');
	var dd = lpad(d.getDate().toString(), 2, '0');
	var hh = lpad(d.getHours().toString(), 2, '0');
	var mm = lpad(d.getMinutes().toString(), 2, '0');
	var ss = lpad(d.getSeconds().toString(), 2, '0');
	return `${yyyy}-${mo}-${dd} ${hh}:${mm}:${ss}`;
}

function lpad(str, padLen, padStr) {
	if (padStr.length > padLen) {
		console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
		return str;
	}
	str += ""; // 문자로
	padStr += ""; // 문자로
	while (str.length < padLen)
		str = padStr + str;
	str = str.length >= padLen ? str.substring(0, padLen) : str;
	return str;
}

function rpad(str, padLen, padStr) {
	if (padStr.length > padLen) {
		console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
		return str + "";
	}
	str += ""; // 문자로
	padStr += ""; // 문자로
	while (str.length < padLen)
		str += padStr;
	str = str.length >= padLen ? str.substring(0, padLen) : str;
	return str;
}

function get_distance(lat1, long1, lat2, long2){
	const X = lat1 - lat2;
	const Y = long1 - long2;
	const R = 6378135 // 지구의 반지름(m)
	const D = (2 * Math.PI * R)/360;
	const C = Math.cos(((long1+long2)/2) * Math.PI / 180) * D;
	return ((X*C)**2 + (Y*D)**2)**0.5;
}

const colorlist = ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850"]
for(let i=0; i<3000; i++) colorlist.push('#'+rpad(parseInt(Math.random() * 16777216).toString(16), 6, '0'));

