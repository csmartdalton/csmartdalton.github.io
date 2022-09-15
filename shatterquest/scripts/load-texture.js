var total_textures_still_loading = 0;

function base64ImageUrl(type, str)
{
	return 'data:image/' + type + ';base64,' + str;
}

function rawImageUrl(type, data_string)
{
	return base64ImageUrl(type, base64enc(data_string));
}

function loadTexture(image,mipmap,premultiply,wrap,format,t)
{
	if (mipmap === undefined) mipmap = true;
	if (premultiply === undefined) premultiply = true;
	if (wrap === undefined) wrap = gl.REPEAT;
	if (format === undefined) format = gl.RGBA;
	
	if (!t) t = {};
	t.texGL = null;
	t.bMipMap = mipmap;
	t.premultiply = premultiply;
	t.wrap = wrap;
	t.format = format;
	t.width = t.height = 0;

	if (typeof image == 'string') {
		t.image = new Image();
		t.image.src = image;
	} else
		t.image = image;

	t.load = function() {
		t.width = t.image.width;
		t.height = t.image.height;
		Nova_LoadTextureGL(t);
		total_textures_still_loading--;
	};

	total_textures_still_loading++;
	if (t.image.complete)
		t.load();
	else
		t.image.onload = function() {t.load()};
	
	return t;
}
