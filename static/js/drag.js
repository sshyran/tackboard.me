poster_editor.drag_handler = {
	_me : null,
	attach : function(me) {
		me.onmousedown = poster_editor.drag_handler._dragBegin;
		me.dragBegin = new Function();
		me.drag = new Function();
		me.dragEnd = new Function();
		return me;
	},
	_dragBegin : function(e) {
		var me = poster_editor.drag_handler._me = this;
		if (isNaN(parseInt(me.style.left))) { me.style.left = '0px'; }
		if (isNaN(parseInt(me.style.bottom))) { me.style.top = '0px'; }
		var x = parseInt(me.style.left);
		var y = parseInt(me.style.bottom);
		e = e ? e : window.event;
		me.mouseX = e.clientX;
		me.mouseY = e.clientY;
		me.dragBegin(me, x, y);
		document.onmousemove = poster_editor.drag_handler._drag;
		document.onmouseup = poster_editor.drag_handler._dragEnd;
		return false;
	},
	_drag : function(e) {
        if (!poster_editor.lock_opts) return
		var me = poster_editor.drag_handler._me;
		var x = parseInt(me.style.left);
		var y = parseInt(me.style.bottom);
		e = e ? e : window.event;
		me.style.left = Math.max(Math.min(x + (e.clientX - me.mouseX), 929), 5) + 'px';
		me.style.bottom = Math.min(Math.max(y + (me.mouseY - e.clientY ), 10), 364) + 'px';
		me.mouseX = e.clientX;
		me.mouseY = e.clientY;
		me.drag(me, x, y);
		return false;
	},
	_dragEnd : function() {
		var me = poster_editor.drag_handler._me;
		var x = parseInt(me.style.left);
		var y = parseInt(me.style.bottom);
		me.dragEnd(me, x, y);
		document.onmousemove = null;
		document.onmouseup = null;
		poster_editor.drag_handler._me = null;
	}
}
