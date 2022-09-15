var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base256 = (function() {
	var arr = new Array();
	for (var i = 0; i < base64.length; i++)
		arr[base64[i]] = i;
	return arr;
})();

function base64enc(data_string)
{
	if (window.btoa)
		return window.btoa(data_string);

	var data = 0;
	var data_length = 0;
	var str = '';
	for (var i = 0; i < data_string.length; i++)
	{
		data = (data << 8) | data_string.charCodeAt(i);
		data_length += 8;
		while (data_length >= 6)
		{
			data_length -= 6;
			str += base64[(data >> data_length) & 0x3f];
		}
	}
	if (data_length == 2)
		str += base64[(data << 4) & 0x3f] + '=' + '=';
	else if (data_length == 4)
		str += base64[(data << 2) & 0x3f] + '=';
	else if (data_length != 0)
		alert("I can't do modular math");
	return str;
}

function base64dec(str)
{
	if (window.atob)
		return window.atob(str);

	var data = 0;
	var data_length = 0;
	var bytes = '';
	for (var i = 0; i < str.length; i++)
	{
		data = (data << 6) | base256[str[i]];
		data_length += 6;
		if (data_length >= 8)
		{
			data_length -= 8;
			bytes += String.fromCharCode((data >> data_length) & 0xff);
		}
	}
	return bytes;
}
