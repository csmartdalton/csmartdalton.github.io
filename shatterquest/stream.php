<?
	$file_name = getcwd() . '/stream/' . str_replace(array('..','/'),'',$_REQUEST['file']);
	$chunk_count = $_REQUEST['chunk-count'];
	$chunk_idx = $_REQUEST['chunk-idx'];

	if ($chunk_idx > 0 && $chunk_idx <= $chunk_count)
	{
		$file = fopen($file_name,'r');
		fseek($file,0,SEEK_END);
		$file_size = ftell($file);
		$chunk_size = (int)($file_size/$chunk_count);
		$start = ($chunk_idx-1) * $chunk_size;
		$count = ($chunk_idx == $chunk_count) ? $file_size - $start : $chunk_size;
		fseek($file,$start);

		while ($count > 65536)
		{
			echo fread($file,65536);
			$count -= 65536;
		}
		echo fread($file,$count);
	}
?>
