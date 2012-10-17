c = function(x){
	console.log(x || "!");
}

create = function(a, b, c, d){
	var x = document.createElement(a);
	for (i in b){
			x[i] = b[i];
	}
	if (c !== undefined){
		x.innerHTML = c;
	}
	d = d || [ ];
	for (e in d){
		x.appendChild(d[e]);
	}
	return x;
}

appendobj = function(a){
	for (var i = 0; i < a.length; i++){
		a[i][0].appendChild(a[i][1]);
	}
}

preload = function(i, set){
	var img = new Image();
	if (i < set.length - 1){
		img.onload = function(){
			preload(i + 1, set);
		}
	}
	img.src = set[i];
}