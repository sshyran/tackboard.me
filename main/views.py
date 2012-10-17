from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response as render
from django.conf import settings
from django.template import RequestContext
from django.utils import simplejson
from main.models import *
import time
import datetime
import re

def index(request):
    if 'MSIE' in request.META['HTTP_USER_AGENT']:
        return render('ie.html')
    else:
        return render('splash.html', {}, context_instance=RequestContext(request))

def stats(request):
    counters = Reference_Counter.objects.all()
    return render('stats.html', {'counters': counters})

def board(request, board_name):
    if 'MSIE' in request.META['HTTP_USER_AGENT']:
        return render('ie.html')
    else:
        b = Tackboard.objects.get(short_name=board_name)
        return render('board.html', {'board': b, 'default_category': Category.objects.get(tackboard=b, default=True).name, 'categories': b.categories.all()}, context_instance=RequestContext(request))
    

def ajax(request, func):
    return globals()[func](request)

def active_posters(request):
    board = Tackboard.objects.get(id=request.GET['board_id'])
    category = filter(lambda x: x.name == request.GET['category'], board.categories.all())[0]
    active = category.posters.filter(active=True)
    tacks = category.posters.filter(active=False, date_created__gte = (datetime.date.today() - datetime.timedelta(14)).isoformat())

    # Security fix: combines different dicts so user can't get the body of torn-down posters but only their tack color and position
    return JSON([dict({p.id: {'id': p.id, 'active': p.active, 'x': p.position_x, 'y': p.position_y, 'tack_color': p.tack_color, 
                       'body': p.body, 'age': ago(p.date_created)} for p in active}.items() + {p.id: {'id': p.id, 'active': p.active, 
                       'x': p.position_x, 'y': p.position_y, 'tack_color': p.tack_color} for p in tacks}.items())])

def ago(date):
    now = datetime.datetime.now()
    if date.year != now.year or date.month != now.month:
        return 'over 2 weeks ago'
    elif date.day != now.day:
        days = now.day - date.day
        if days == 1:
            return 'yesterday'
        weeks = int(days / 7)
        if weeks:
            if weeks > 2:
                return 'over 2 weeks ago'
            else: 
                return '%s week%s ago' % (weeks, '' if weeks == 1 else 's')
        else:
            return '%s days ago' % (now.day - date.day)
    else:
        return 'today'

def add_poster(request):
    post = request.POST
    error = validate_poster(post) # Validating everything
    if error: 
        return JSON({403: error})
    p = Poster(active = True, position_x = post['x'], position_y = post['y'], tack_color = post['tack_color'], body = post['body'], from_user_agent = request.META['HTTP_USER_AGENT'], from_ip = request.META['REMOTE_ADDR'])
    p.save()
    t = Tackboard.objects.get(id = post['board_id'])
    c = Category.objects.get(tackboard = t, name = request.POST['category'])
    c.posters.add(p)
    t.save()
    return JSON([200, {'id': p.id, 'active': p.active}])
 
def remove_poster(request):
    post = request.POST
    poster = Poster.objects.get(id=post['poster_id'])
    poster.active = False
    poster.date_removed = datetime.datetime.now()
    poster.save()
    return HttpResponse(status=200)

def retrieve_poster(request):
    p = Poster.objects.get(id=request.GET['poster_id'])
    if not p.active:
        return HttpResponse(status=403)
    return JSON([{'id': p.id, 'active': p.active, 'x': p.position_x, 'y': p.position_y, 'tack_color': p.tack_color, 
                         'body': p.body, 'age': ago(p.date_created)}])
def update(request):
    board = Tackboard.objects.get(id=request.GET['board_id'])
    category = filter(lambda x: x.name == request.GET['category'], board.categories.all())[0]
    active = category.posters.filter(active=True)
    tacks = category.posters.filter(active=False, date_created__gte = (datetime.date.today() - datetime.timedelta(14)).isoformat())
    data = { }
    for poster in active | tacks:
        data[poster.id] = poster.active
    return JSON([ data ]) 

def reference_counter(request):
    counter = Reference_Counter.objects.get(name=request.POST['action'])
    counter.count = counter.count + 1
    counter.save()
    return HttpResponse(status=200)

def validate_poster(data):
    if data['body'] == '':
        return 'EMPTY'
    forbidden_strings = ['"javascript:', 'background:']
    if '"javascript:' in data['body']:
        return '[Script injection]'
    if 0 > data['x'] > 850 or 0 > data['y'] > 335:
        return 'Invalid position'
    tags = re.findall(r'\<(?P<tagname>[^\/][\w]+)[^/]+\/[\w]+>', data['body'])
    if tags:
        for tag in tags:
            if tag not in ['span', 'div', 'a', 'b', 'u', 'i', 'br']: # safe tags
                return '[HTML injection] %s ' % tag
    return False

def JSON(json):
    return HttpResponse(simplejson.dumps(json, separators=(',',':')), mimetype='application/javascript')
