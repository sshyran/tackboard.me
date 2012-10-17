from django.conf.urls.defaults import patterns, include, url
from django.conf import settings

urlpatterns = patterns('',
    url(r'^static/(?P<path>.*)$', 'django.views.static.serve',{'document_root':settings.STATIC_ROOT}),
    url(r'^ajax/(?P<func>\w+)', 'main.views.ajax'),
    url(r'^stats/?', 'main.views.stats'),
    url(r'(?P<board_name>[\w\-]+)/?', 'main.views.board'),
    url(r'^$', 'main.views.index'),
)
