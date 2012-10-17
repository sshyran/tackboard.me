from django.db import models

class Tackboard(models.Model):
    def __unicode__(self):
        return '%s tackboard with %s categories' % (self.name, len(self.categories.all()))
    def set_default(self, new_default):
        for c in self.categories.all():
            if (c.name == new_default):
                c.default = True
            else:
                c.default = False
            c.save()
    def list_categories(self):
        categories_list = []
        for c in self.categories.all():
            categories_list.append([c.name, c.active_posters()])
        return categories_list
    name = models.CharField(max_length=50)
    short_name = models.CharField(max_length=20)
    categories = models.ManyToManyField('Category')
    date_created = models.DateTimeField(auto_now_add=True)
    refresh_rate = models.IntegerField()

class Category(models.Model):
    def __unicode__(self):
        try:
            board = Tackboard.objects.get(categories=self).name
        except:
            board = "[unset]"
        return '%s category on %s board with %s posters' % (self.name, board, len(self.posters.all()))
    def active_posters(self):
        return len(filter(lambda x: x.active == True, self.posters.all() ) )
    name = models.CharField(max_length=40)
    posters = models.ManyToManyField('Poster')
    default = models.BooleanField(default=False)

class Poster(models.Model):
    def __unicode__(self):
        return '%s: %s' % (self.id, self.body[:20])
    def get_category(self):
        return Category.objects.get(posters=self)
    date_created = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField()
    position_x = models.IntegerField()
    position_y = models.IntegerField()
    tack_color = models.CharField(max_length=1)
    body = models.TextField()
    date_removed = models.DateTimeField(auto_now_add=True)
    from_user_agent = models.CharField(max_length=200)
    from_ip = models.CharField(max_length=20)

class Reference_Counter(models.Model):
    def __unicode__(self):
        return '%s : %s' % (self.name, self.count)
    count = models.IntegerField()
    name = models.CharField(max_length=30)
