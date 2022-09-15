<html>
<head>
</head>

<body style='margin:0; padding:0'>

<script type='text/javascript' src='/download-file.js'></script>
<script type='text/javascript' src='/base64.js'></script>
<script type='text/javascript' src='/data-stream.js'></script>
<script type='text/javascript' src='/PersistentStore.js'></script>
<script type='text/javascript' src='/knockout/common.js'></script>
<script type='text/javascript'>

	document.write('starting <br />');

	psBeginWrite();
	psBegin(16384);
		psWriteDword(1000000000);
		psWriteByte(2);
		psWriteFloat(-6.7967958450317);
		psWriteDwordArray([1,2,3,4,5], 5);
		psWriteByteArray([256,257,258], 3);
		psWriteFloatArray([-1.7*Math.pow(2,-130),257,1.3*Math.pow(2,99)], 3);
	psEnd(16384);
	psWriteByteTag(17,18);
	var ps = psEndWrite();

	psParse({}, function(param, tag, length) {
		document.write('tag: ' + tag + '<br />');
		if (tag == 16384)
		{
			document.write(psReadDword() + '<br />');
			document.write(psReadByte() + '<br />');
			document.write(psReadFloat() + '<br />');
			document.write(psReadDwordArray(5) + '<br />');
			document.write(psReadByteArray(3) + '<br />');
			document.write(psReadFloatArray(3) + '<br />');
		}
		else
		{
			document.write(psReadByte() + '<br />');
		}
	}, psOpenForRead(ps));
</script>

</body></html>

